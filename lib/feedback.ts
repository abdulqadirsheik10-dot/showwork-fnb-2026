import {getTask} from './tasks';
export const RULE_VERSION='language-checks-1.1';
export type Finding={id:string;label:string;found:boolean;evidence:string|null;note:string};
export type Feedback={version:string;mode:'rules';findings:Finding[];warnings:string[];nextTask:string;reason:string};
export function assess(taskId:string,response:string):Feedback{
 const task=getTask(taskId);if(!task)throw new Error('Unknown task');
 const sentences=response.split(/(?<=[.!?\n])\s*/).filter(Boolean);
 const passages=[...sentences,...sentences.flatMap((s,i)=>{const start=response.indexOf(s);const next=sentences[i+1];return next?[response.slice(start,response.indexOf(next,start+s.length)+next.length)]:[]})];
 const evidence=(patterns:RegExp[])=>passages.find(s=>patterns.every(p=>p.test(s))) || null;
 const any=(p:RegExp)=>evidence([p]);
 let matches:Record<string,string|null>={};
 if(taskId==='double-charge') matches={care:any(/\b(sorry|understand|frustrat\w*|concern|inconvenien\w*)\b/i),facts:evidence([/pending/i,/180|settled|confirm/i]),action:evidence([/supervisor/i,/check|confirm|verify|review/i]),clarity:any(/\b(first|then|next|before|after)\b/i)};
 if(taskId==='stock-check') matches={expected:evidence([/\b17\b/,/24\s*\+\s*12\s*[-−]\s*19/]),difference:evidence([/\b2\b/,/short|missing|less|difference|fewer/i]),action:evidence([/recount/i,/record|check/i]),clarity:any(/\b(first|then|next|before)\b/i)};
 if(taskId==='handover') matches={facts:evidence([/204/,/\b8\b/,/\b2\b/]),done:evidence([/supervisor/i,/notified|informed|told/i]),action:evidence([/supplier/i,/supervisor/i,/follow|contact|check/i]),clarity:any(/keep.*open|incomplete|do not mark.*complete|don.t mark.*complete/i)};
 const warnings:string[]=[];
 if(taskId==='double-charge' && sentences.some(s=>/\b(refund|release)\b/i.test(s)&&/today|immediately|guarantee/i.test(s)&&!(/cannot|can.t|not|no guarantee|only|after|if/i.test(s))))warnings.push('Check the policy: promising an immediate refund or a bank release time is not supported by the scenario.');
 if(taskId==='stock-check'&&/\b(theft|stole|stolen)\b/i.test(response)&&!(/not|cannot|don.t|no evidence/i.test(response)))warnings.push('The discrepancy does not establish theft. Describe the facts and investigate before assigning a cause.');
 const findings=task.checks.map(c=>{const quote=matches[c.id];return {id:c.id,label:c.label,found:!!quote,evidence:quote,note:quote?'A related phrase was found. Check that it means what you intended.':c.guidance}});
 let nextTask=taskId,reason='Revise this response using the prompts marked “Review”.';
 if(findings.every(f=>f.found)&&!warnings.length){nextTask=taskId==='double-charge'?'stock-check':taskId==='stock-check'?'handover':'double-charge';reason='The checks found a phrase for each prompt. Try a different task next. A person still needs to review the quality of your response.';}
 return {version:RULE_VERSION,mode:'rules',findings,warnings,nextTask,reason};
}
