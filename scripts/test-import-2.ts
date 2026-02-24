import { getTasks } from '../src/actions/tasks'; console.log('Import successful'); try { await getTasks(); console.log('Call successful'); } catch(e) { console.error(e); }
