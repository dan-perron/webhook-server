import config from 'config';
import { Configuration, OpenAIApi } from 'openai';
import {
  basePrompt,
  cabinPrompt,
  getOotpChatPrompt,
  getPowerRankingsPrompt,
  politicsPrompt,
  specialistPrompt,
  sportsPrompt,
} from '../../consts/prompts.js';
import type { AIClient } from './AIClient.js';

const configuration = new Configuration({
  organization: 'org-U5TjmhDs7z61xmWCmBOXtFiU',
  apiKey: config.get('openai.key'),
});
const openai = new OpenAIApi(configuration);
export class OpenAI implements AIClient {
  cabinChat({ input }) {
    const systemPrompt = basePrompt + cabinPrompt;
    return this.getResponse({ input, systemPrompt });
  }

  ootpChat({ turnInfo = null, input, powerRankings = null, reminders = null }) {
    const systemPrompt =
      basePrompt + getOotpChatPrompt({ turnInfo, powerRankings, reminders });
    return this.getResponse({ input, systemPrompt });
  }

  politicsChat({ input }) {
    const systemPrompt = basePrompt + politicsPrompt;
    return this.getResponse({ input, systemPrompt });
  }

  specialistChat({ input }) {
    const systemPrompt = basePrompt + specialistPrompt;
    return this.getResponse({ input, systemPrompt });
  }

  sportsChat({ input }) {
    const systemPrompt = basePrompt + sportsPrompt;
    return this.getResponse({ input, systemPrompt });
  }

  generatePowerRankings({ input, data }) {
    const conf = this.extractConf(input);
    const prompt = getPowerRankingsPrompt({ data });
    return this.complete({ prompt, conf });
  }

  testChat({ input }) {
    return this.getResponse({ input, systemPrompt: basePrompt });
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
    return this.getResponse({ input, systemPrompt });
  }

  extractConf(input) {
    let conf;
    if (input[0].content.startsWith('{') || input[0].content.startsWith('`{')) {
      const split = input[0].content.split('\n');
      conf = JSON.parse(split.shift().replaceAll('`', ''));
      conf.openai = conf.openai || {};
      input[0].content = split.join('\n');
    }
    return conf;
  }

  confHasValue(conf, prop) {
    if (!conf) {
      return false;
    }
    return conf.hasOwn(prop);
  }

  getConfigWithConf(confKey, conf) {
    if (this.confHasValue(conf, confKey)) {
      return conf[confKey];
    }
    return config.get('openai.' + confKey);
  }

  async getResponse({ input, systemPrompt }) {
    if (!config.get('openai.returnImages')) {
      return this.chat({ input, systemPrompt });
    }
    switch (await this.determineOutputType({ input, systemPrompt })) {
      case 'IMAGE':
        return this.generateImage({ input, systemPrompt });
      case 'TEXT':
      default:
        return this.chat({ input, systemPrompt });
    }
  }

  async determineOutputType({ input, systemPrompt }) {
    const localInput = [...input];
    localInput.push({
      role: 'user',
      content:
        'Is previous message requesting a text response or image response? Please respond just with IMAGE or TEXT',
    });
    const outputType = await this.chat({
      input: localInput,
      systemPrompt,
      model: 'gpt-3.5-turbo',
    });
    if (['IMAGE', 'TEXT'].includes(outputType)) {
      return outputType;
    }
    console.log(`output type determination failed, got: '${outputType}'`);
    return 'TEXT';
  }

  async chat({ input, systemPrompt, model = null }) {
    const conf = this.extractConf(input);
    if (this.getConfigWithConf('useComplete', conf)) {
      return this.completeFromChat({ input, systemPrompt, conf });
    }
    const messages = [{ role: 'system', content: systemPrompt }];
    messages.push(...input);
    console.log(JSON.stringify(messages, null, 2));
    if (!model) {
      model = this.getConfigWithConf('model', conf);
    }
    const completion = await openai.createChatCompletion({
      model,
      messages,
      ...(this.confHasValue(conf, 'openai') ? conf.openai : {}),
    });
    console.log(JSON.stringify(completion.data.choices, null, 2));
    return completion.data.choices[0].message.content;
  }

  convertInputToPrompt({ input, systemPrompt }) {
    let prompt = systemPrompt;
    for (const message of input) {
      prompt += `

<@${message.name}> says "${message.content}"`;
    }
    return prompt;
  }

  async generateImage({ input, systemPrompt }) {
    const localInput = [...input];
    localInput.push({
      role: 'user',
      content:
        'What is a DALL·E prompt that would generate the image in the previous message? Please just return the prompt without any quotes.',
    });
    const prompt = await this.chat({ input: localInput, systemPrompt });
    const response = await openai.createImage({
      prompt,
      n: 1,
      size: '1024x1024',
    });
    return response.data.data[0].url;
  }

  async completeFromChat({ input, systemPrompt, conf }) {
    return this.complete({
      prompt: this.convertInputToPrompt({ input, systemPrompt }),
      conf,
    });
  }

  async complete({ prompt, conf }) {
    console.log(JSON.stringify(prompt, null, 2));
    const response = await openai.createCompletion({
      model: 'gpt-3.5-turbo-instruct',
      prompt,
      max_tokens: 1500,
      ...(this.confHasValue(conf, 'openai') ? conf.openai : {}),
    });
    console.log(JSON.stringify(response.data, null, 2));
    return response.data.choices[0].text;
  }
}
