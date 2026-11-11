import type {Message} from '../types';
export function pollOptionCounts(poll:NonNullable<Message['poll']>){return poll.anonymousVersion===1?poll.counts||{}:Object.fromEntries(poll.options.map(option=>[option.id,Object.values(poll.votes||{}).filter(ids=>ids.includes(option.id)).length]));}
export function pollVoterCount(poll:NonNullable<Message['poll']>){return poll.anonymousVersion===1?poll.voterCount||0:Object.values(poll.votes||{}).filter(ids=>ids.length).length;}
