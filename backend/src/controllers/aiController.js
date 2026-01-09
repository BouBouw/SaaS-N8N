import axios from 'axios';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export const createWorkflow = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.id;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        message: 'Prompt is required'
      });
    }

    if (!DEEPSEEK_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'DeepSeek API key not configured'
      });
    }

    // System prompt for N8N workflow generation
    const systemPrompt = `You are an expert N8N workflow automation assistant. Your task is to create valid N8N workflow JSON based on user requests.

IMPORTANT RULES:
1. Always return valid N8N workflow JSON format
2. Include proper node connections
3. Use realistic node types (webhook, http, email, etc.)
4. Add proper coordinates for visual layout
5. Include credentials placeholders
6. Return ONLY the workflow JSON and a brief description

Response format:
{
  "description": "Brief description of what this workflow does",
  "workflow": {
    "name": "Workflow name",
    "nodes": [...],
    "connections": {...},
    "settings": {
      "executionOrder": "v1"
    }
  }
}

Example N8N node structure:
{
  "parameters": {},
  "name": "Webhook",
  "type": "n8n-nodes-base.webhook",
  "typeVersion": 1,
  "position": [250, 300],
  "webhookId": "unique-id"
}`;

    // Call DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    // Parse the AI response
    let workflowData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || 
                       aiResponse.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        workflowData = JSON.parse(jsonMatch[1]);
      } else {
        workflowData = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Failed to parse workflow from AI response',
        rawResponse: aiResponse
      });
    }

    // Validate workflow structure
    if (!workflowData.workflow || !workflowData.workflow.nodes) {
      return res.status(500).json({
        success: false,
        message: 'Invalid workflow structure from AI'
      });
    }

    res.json({
      success: true,
      data: {
        description: workflowData.description || 'Workflow créé par IA',
        workflow: workflowData.workflow
      }
    });

  } catch (error) {
    console.error('Error creating workflow with AI:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Error generating workflow',
      error: error.response?.data || error.message
    });
  }
};

export default {
  createWorkflow
};
