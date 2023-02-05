import { watch } from 'node:fs';

let fileToSlackMap = {
    'team_7.ootp': "U6BEBDULB",
    'team_11.ootp': "U6KNBPYLE",
    'team_13.ootp': "U6CACS3GW",
    'team_20.ootp': "U6AT12XSM",
};
watch('/ootp/game/team_uploads',(eventType, filename) => {
    console.log(`event type is: ${eventType}`);
    if (filename) {
        console.log(`filename provided: ${filename}`);
    } else {
        console.log('filename not provided');
    }
});