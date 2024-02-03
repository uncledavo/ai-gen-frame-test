// Import necessary libraries
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract text input from the request body
      const { textInput } = req.body;

      // Call the Replicate API with the text input
      const response = await axios.post('https://api.replicate.com/v1/predictions', {
        version: 'ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4', // Specify your Stable Diffusion model version
        input: { prompt: textInput },
      }, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      // Respond with the generated image URL or data
      res.status(200).json({ imageUrl: response.data.output });
    } catch (error) {
      console.error('Error generating image:', error);
      res.status(500).json({ error: 'Failed to generate image' });
    }
  } else {
    // Handle any non-POST requests
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}