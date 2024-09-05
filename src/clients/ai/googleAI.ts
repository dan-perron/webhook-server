import config from 'config';
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai';
import type { AIClient } from './AIClient.js';
import {
  basePrompt,
  cabinPrompt,
  getOotpChatPrompt,
  politicsPrompt,
  specialistPrompt,
  sportsPrompt,
} from '../../consts/prompts.js';

export class GoogleAI implements AIClient {
  genAI = new GoogleGenerativeAI(config.get('googleai.key'));

  model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

  getSafetySettings() {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ];
  }

  async chat({ input, systemPrompt }) {
    const messages = [
      { role: 'user', parts: systemPrompt },
      { role: 'model', parts: 'okay' },
    ];
    messages.push(
      ...input.map((i) => {
        return {
          parts: i.content,
          role: i.role === 'assistant' ? 'model' : 'user',
          name: i.name,
        };
      })
    );
    messages.splice(-1, 0, {role: 'user', parts: `I am ${input.at(-1).name}`}, {role: 'model', parts: 'okay'})
    console.log(JSON.stringify(messages, null, 2));
    const lastMessage = messages.pop();
    const chat = await this.model.startChat({
      history: messages,
      generationConfig: {},
      safetySettings: this.getSafetySettings(),
    });
    const result = await chat.sendMessage(lastMessage.parts);
    const response = await result.response;
    console.log(JSON.stringify(response, null, 2));
    return response.text();
  }

  cabinChat({ input }) {
    const systemPrompt = basePrompt + cabinPrompt;
    return this.chat({ input, systemPrompt });
  }

  ootpChat({ turnInfo, input, powerRankings, reminders }) {
    const systemPrompt =
      basePrompt + getOotpChatPrompt({ turnInfo, powerRankings, reminders });
    return this.chat({ input, systemPrompt });
  }

  politicsChat({ input }) {
    const systemPrompt = basePrompt + politicsPrompt;
    return this.chat({ input, systemPrompt });
  }

  specialistChat({ input }) {
    const systemPrompt = basePrompt + specialistPrompt;
    return this.chat({ input, systemPrompt });
  }

  sportsChat({ input, data }) {
    const systemPrompt = basePrompt + sportsPrompt + JSON.stringify(data);
    return this.chat({ input, systemPrompt });
  }

  generatePowerRankings() {
    return Promise.resolve('');
  }

  testChat({ input }) {
    return this.chat({ input, systemPrompt: basePrompt });
  }

  genericChat({ input, reminders }) {
    let systemPrompt = basePrompt;
    if (reminders) {
      systemPrompt += `

Here are a list of reminders:
${reminders}`;
    } else {
      systemPrompt += `

There are no reminders.`;
    }
    return this.chat({ input, systemPrompt });
  }
}
