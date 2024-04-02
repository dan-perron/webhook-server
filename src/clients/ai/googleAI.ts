import config from 'config';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import type { AIClient } from './AIClient.js';
import {
  basePrompt,
  cabinPrompt,
  getOotpChatPrompt, getPowerRankingsPrompt,
  politicsPrompt,
  specialistPrompt,
  sportsPrompt,
} from '../../consts/prompts.js';

export class GoogleAI implements AIClient {
  genAI = new GoogleGenerativeAI(config.get('googleai.key'));

  model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

  getSafetySettings() {
    return Object.values(HarmCategory).map((hc) => {
      return { category: hc, threshold: HarmBlockThreshold.BLOCK_NONE };
    });
  }

  async chat({ input, systemPrompt }) {
    const messages = [{ role: 'user', parts: systemPrompt }];
    messages.push(...input.map(i => {
      return { parts: i.content, role: i.role === 'system' ? 'model' : 'user', name: i.name };
    }));
    console.log(JSON.stringify(messages, null,2));
    const lastMessage = messages.pop();
    if (messages[messages.length].role !== 'model') {
      messages.push({ parts: 'okay', role: 'model' });
    }
    console.log(JSON.stringify(messages, null, 2));
    const chat = await this.model.startChat({
      history: messages,
      generationConfig: {},
      //safetySettings: this.getSafetySettings(),
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
    let systemPrompt =
      basePrompt +
      getOotpChatPrompt({ turnInfo, powerRankings, reminders });
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

  sportsChat({ input }) {
    const systemPrompt = basePrompt + sportsPrompt;
    return this.chat({ input, systemPrompt });
  }

  generatePowerRankings({ input, data }) {
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