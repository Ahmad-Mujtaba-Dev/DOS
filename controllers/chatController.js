const axios = require('axios');

const chatController = {
    sendMessage: async (req, res) => {
        console.log("reqreqreq", req.body.message);
        try {
            const { message } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            const response = await axios.post('https://a330-173-208-156-111.ngrok-free.app/chat/', {
                message
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log("response", response.data);

            return res.json(response.data);
        } catch (error) {
            console.error('Chat error:', error);
            return res.status(500).json({ error: 'Failed to process chat message' });
        }
    }
};

module.exports = chatController; 