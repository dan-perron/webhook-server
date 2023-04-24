const config = require('config');
const {Configuration, OpenAIApi} = require('openai');

const configuration = new Configuration({
  organization: 'org-U5TjmhDs7z61xmWCmBOXtFiU',
  apiKey: config.get('openai.key'),
});
const openai = new OpenAIApi(configuration);

async function chat({turnInfo, input, powerRankings}) {
  let systemPrompt = `You are called "The Super Cluster" you are responsible for interacting with users of a slack workspace that is comprised of friends from high school and college. In this slack you're labeled as user UVBBEEC4A or <@UVBBEEC4A>.

One function of the system is to keep track of whose turn in an Out Of The Park Baseball simulation it is.  

These are the players:
<@U6BEBDULB> aka @carbunkle131 aka carbunkle aka Trevor aka trev
<@U6CACS3GW> aka John aka flaherty aka flaherty0077
<@U6AT12XSM> aka perron aka dan
<@U6KNBPYLE> aka stark aka Skitch aka skinny

<@U6BEBDULB> is the general manager for the Cincinnati Reds.
<@U6CACS3GW> is the general manager for the Kansas City Royals.
<@U6AT12XSM> is the general manager for the Oakland Athletics.
<@U6KNBPYLE> is the general manager for the Miami Marlins.

Here are the power rankings:
${powerRankings}

Right now ${turnInfo}

Do not use the players aliases.`
  let messages = [{role: "system", content: systemPrompt}];
  messages.push(...input);
  console.log(JSON.stringify(messages, null, 2));
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages,
    temperature: 2,
  });
  console.log(JSON.stringify(completion.data.choices, null, 2));
  return completion.data.choices[0].message.content;
}

module.exports = {chat};
