import { readFile, writeFile, rename, mkdir, copyFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { validWorkspace } from '../public/workspace-validation.js';
export { validWorkspace };
export class WorkspaceStore {
  constructor(file) { this.file=file; this.queue=Promise.resolve(); }
  async read() {
    try { const data=JSON.parse(await readFile(this.file,'utf8')); if (!validWorkspace(data)) throw new Error('손상된 업무 데이터입니다. 백업 파일을 확인해 주세요.'); return data; }
    catch(error) { if (error.code === 'ENOENT') return null; throw error; }
  }
  write(data) {
    if (!validWorkspace(data)) return Promise.reject(new Error('업무 데이터 형식이 올바르지 않습니다.'));
    const snapshot=JSON.stringify(data,null,2);
    const operation=this.queue.catch(()=>{}).then(async()=> {
      await mkdir(dirname(this.file),{recursive:true});
      try { await copyFile(this.file,`${this.file}.previous`); } catch(error) { if (error.code !== 'ENOENT') throw error; }
      await writeFile(`${this.file}.tmp`,snapshot,{encoding:'utf8',mode:0o600});
      await rename(`${this.file}.tmp`,this.file);
    });
    this.queue=operation; return operation;
  }
}
