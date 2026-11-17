// Remove obsolete generated voice binaries before dev/install/hosting builds.
require('node:fs').rmSync(require('node:path').resolve(__dirname,'../public/tts'),{recursive:true,force:true});
