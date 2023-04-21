const config = require('config');
const {Configuration, OpenAIApi} = require('openai');

const configuration = new Configuration({
  organization: 'org-U5TjmhDs7z61xmWCmBOXtFiU',
  apiKey: config.get('openai.key'),
});
const openai = new OpenAIApi(configuration);

async function chat({turnInfo, input}) {
  let systemPrompt = `You are called "The Super Cluster" you are responsible for interacting with users of a slack workspace that is comprised of friends from high school and college.

One function of the system is to keep track of whose turn in an Out Of The Park Baseball simulation it is.  

These are the players:
<@U6BEBDULB> aka @carbunkle131 aka carbunkle aka Trevor aka trev
<@U6CACS3GW> aka John aka flaherty aka flaherty0077
<@U6AT12XSM> aka perron aka dan
<@U6KNBPYLE> aka stark aka Skitch aka skinny

${turnInfo}

Do not use the players aliases.`
  let messages = [{role: "system", content: systemPrompt}];
  messages.push(...input);
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
  });
  return completion.data.choices[0].message;
}

module.exports = {chat};
