import axios from 'axios';
import { HfInference } from '@huggingface/inference';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Initialize dotenv to access .env variables
dotenv.config();

// Initialize Hugging Face Inference API
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({limit:'50mb'}));

// Helper function to fetch an image as a Buffer and handle errors
const fetchImageAsBuffer = async (imageUrl: string): Promise<Buffer> => {
  try {
 

    // Axios request to fetch the image as a binary buffer
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000,  // 30 seconds timeout
    });

    // Check if the request was successful
    if (response.status >= 200 && response.status < 300) {
      console.log('Image fetched successfully');
      const buffer = Buffer.from(response.data, 'binary');
      return buffer;
    } else {
      console.error('Error fetching image, status code:', response.status);
      throw new Error('Failed to fetch image');
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error('Failed to fetch or convert image');
  }
};

// Convert Buffer to ArrayBuffer if necessary
const convertBufferToArrayBuffer = (buffer: Buffer): ArrayBuffer => {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
};

// Route to process image and call Hugging Face API
app.post('/api/detect', async (req, res) => {
  try {
    const { imageUrl, model } = req.body;

    // Ensure model is provided
    if (!model) {
      return res.status(400).json({ error: 'Model ID is required' });
    }

    // Fetch the image and convert to buffer
    const imageBuffer = await fetchImageAsBuffer(imageUrl);

    // Convert Buffer to ArrayBuffer
    const imageArrayBuffer = convertBufferToArrayBuffer(imageBuffer);

    // Use Hugging Face Inference API for image classification
    const result = await hf.imageClassification({
      model,  // Model ID (e.g., prithivMLmods/Deep-Fake-Detector-Model)
      data: imageArrayBuffer,  // Image as ArrayBuffer
    });

    console.log('Image classification result:', result);

    // Send back the result to the client
    res.json({ result });
  } catch (error) {
    console.error('Error during image classification:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
