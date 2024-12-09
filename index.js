
// const express = require('express');
// const multer = require('multer');
// const { exec } = require('child_process');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const PORT = 5000;


// const cors = require('cors');
// app.use(cors({
//   origin: "*"
// }));

// // Configure multer for file uploads
// const upload = multer({ dest: 'uploads/' });

// /**
//  * Unlock PDF using qpdf
//  */
// const unlockPdf = (inputPath, password, outputPath) => {
//   return new Promise((resolve, reject) => {
//     const qpdfPath = '"C:\\Program Files\\qpdf 11.9.1\\bin\\qpdf.exe"';  // Make sure this path is correct
//     const command = `${qpdfPath} --decrypt --password=${password} "${inputPath}" "${outputPath}"`;
    
//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         reject(stderr || error.message);
//         return;
//       }
//       resolve(outputPath);
//     });
//   });
// };

// // Endpoint to upload and unlock the PDF
// app.post('/unlock-pdf', upload.single('file'), async (req, res) => {
//   const file = req.file;
//   const password = req.body.password;

//   if (!file || !password) {
//     return res.status(400).send('File and password are required.');
//   }

//   const inputPath = file.path;
//   const outputPath = path.join('unlocked', `${file.filename}.pdf`);

//   try {
//     if (!fs.existsSync('unlocked')) fs.mkdirSync('unlocked');

//     // Unlock the PDF
//     await unlockPdf(inputPath, password, outputPath);

//     // Stream the unlocked file as a response
//     const absoluteOutputPath = path.resolve(outputPath);
//     res.setHeader('Content-Disposition', `attachment; filename="${path.basename(absoluteOutputPath)}"`);
//     res.setHeader('Content-Type', 'application/pdf');
//     const fileStream = fs.createReadStream(absoluteOutputPath);
//     fileStream.pipe(res);

//     // Clean up files after sending
//     fileStream.on('end', () => {
//       fs.unlinkSync(inputPath);
//       fs.unlinkSync(absoluteOutputPath);
//     });

//     fileStream.on('error', (err) => {
//       res.status(500).send('Failed to stream the unlocked PDF.');
//     });
//   } catch (error) {
//     res.status(500).send('Failed to unlock the PDF. Make sure the password is correct.');
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });



const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;

const cors = require('cors');
app.use(cors({
  origin: "*"
}));

// Configure multer for in-memory storage
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Unlock PDF using qpdf
 */
const unlockPdf = (inputBuffer, password) => {
  return new Promise((resolve, reject) => {
    // Generate unique temporary file paths
    const uniqueId = Date.now();
    const tempInputPath = path.join(__dirname, `tempInput_${uniqueId}.pdf`);
    const tempOutputPath = path.join(__dirname, `tempOutput_${uniqueId}.pdf`);

    // Save the buffer to a temporary file
    fs.writeFileSync(tempInputPath, inputBuffer);

    const qpdfPath = '"C:\\Program Files\\qpdf 11.9.1\\bin\\qpdf.exe"';  // Ensure this path is correct
    // const command = `${qpdfPath} --decrypt --password=${password} "${tempInputPath}" "${tempOutputPath}"`; // This is used locally
    const command = `qpdf --decrypt --password=${password} "${tempInputPath}" "${tempOutputPath}"`; //This is used in production

    exec('qpdf --version', (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing qpdf --version:", stderr || error.message);
      } else {
        console.log("qpdf version:", stdout);
      }
    });

    exec(command, (error) => {
      if (error) {
        // Clean up temporary files if an error occurs
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        console.log(error.message)
        reject(error.message);
        return;
      }

      // Read the unlocked file into a buffer
      const unlockedBuffer = fs.readFileSync(tempOutputPath);

      // Clean up temporary files
      fs.unlinkSync(tempInputPath);
      fs.unlinkSync(tempOutputPath);

      resolve(unlockedBuffer);
    });
  });
};


app.get("/", (req, res) => {
  res.send("Started!");
})

// Endpoint to upload and unlock the PDF
app.post('/unlock-pdf', upload.single('file'), async (req, res) => {
  const file = req.file;
  const password = req.body.password;

  console.log(password)

  if (!file || !password) {
    return res.status(400).send('File and password are required.');
  }

  try {
    // Unlock the PDF
    const unlockedBuffer = await unlockPdf(file.buffer, password);

    // Send the unlocked file as a response
    res.setHeader('Content-Disposition', 'attachment; filename="unlocked.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    res.send(unlockedBuffer);
  } catch (error) {
    res.status(500).send('Failed to unlock the PDF. Make sure the password is correct.');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
