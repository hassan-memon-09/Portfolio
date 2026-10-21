import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import ts from 'typescript';
import nodemailer from 'nodemailer';
const compile = s => ts.transpileModule(s, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
const url = code => 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
const validation = url(compile(await readFile(new URL('../lib/contact-validation.ts', import.meta.url), 'utf8')));
const source = compile(await readFile(new URL('../app/api/contact/route.ts', import.meta.url), 'utf8')).replace("'nodemailer'", JSON.stringify(import.meta.resolve('nodemailer'))).replace("'../../../lib/contact-validation'", JSON.stringify(validation));
let index = 0;
async function setup(t) {
 const original = { ...process.env };
 t.after(() => { for(const k of ['SMTP_USER','SMTP_PASSWORD','CONTACT_TO_EMAIL']) { if(original[k]===undefined) delete process.env[k]; else process.env[k]=original[k]; } });
 process.env.SMTP_USER='owner@example.com';process.env.SMTP_PASSWORD='fake-app-password';process.env.CONTACT_TO_EMAIL='owner@example.com';
 const send = t.mock.fn(async () => ({ accepted:['test@example.com'] }));
 t.mock.method(nodemailer,'createTransport',()=>({sendMail:send}));
 const {POST}=await import(url(source+'\n// instance '+index++));
 const fields={name:'Test Visitor',email:'visitor@example.com',company:'',topic:'Project inquiry',message:'Please contact me about building a new application.',consent:true,website:'',submissionId:randomUUID()};
 const request=(changes={},headers={})=>new Request('http://localhost:3000/api/contact',{method:'POST',headers:{'content-type':'application/json',origin:'http://localhost:3000',...headers},body:JSON.stringify({...fields,...changes})});
 return {POST,send,request};
}
test('sends owner inquiry and visitor confirmation with correct reply addresses',async t=>{
 const {POST,send,request}=await setup(t);const result=await POST(request());assert.equal(result.status,200);assert.equal((await result.json()).success,true);assert.equal(send.mock.callCount(),2);
 const first=send.mock.calls[0].arguments[0],second=send.mock.calls[1].arguments[0];assert.equal(first.to,'owner@example.com');assert.equal(first.replyTo,'visitor@example.com');assert.equal(second.to,'visitor@example.com');assert.equal(second.replyTo,'owner@example.com');assert.ok(!second.text.includes('new application'));
});
test('missing SMTP credentials prevents delivery',async t=>{const {POST,send,request}=await setup(t);process.env.SMTP_PASSWORD='';assert.equal((await POST(request())).status,503);assert.equal(send.mock.callCount(),0)});
test('invalid fields and cross-site requests are rejected',async t=>{const {POST,send,request}=await setup(t);assert.equal((await POST(request({email:'invalid'}))).status,400);assert.equal((await POST(request({}, {origin:'https://evil.example'}))).status,403);assert.equal(send.mock.callCount(),0)});
test('HTML is escaped and retry does not duplicate accepted messages',async t=>{const {POST,send,request}=await setup(t);const body={message:'<script>alert(1)</script> Please discuss this project.'};await POST(request(body));await POST(request(body));assert.equal(send.mock.callCount(),2);assert.ok(send.mock.calls[0].arguments[0].html.includes('&lt;script&gt;'))});
test('owner SMTP failure returns error and does not send a receipt',async t=>{const {POST,send,request}=await setup(t);send.mock.mockImplementation(async()=>{throw new Error('private credentials')});const response=await POST(request());assert.equal(response.status,502);assert.equal(send.mock.callCount(),1);assert.ok(!JSON.stringify(await response.json()).includes('private credentials'))});
test('receipt failure preserves successful inquiry and explains partial result',async t=>{const {POST,send,request}=await setup(t);let n=0;send.mock.mockImplementation(async()=>{if(n++)throw new Error('receipt failed');return {accepted:['owner@example.com']}});const body=await (await POST(request())).json();assert.equal(body.success,true);assert.ok(body.message.includes('confirmation email could not be sent'))});
test('honeypot and large payloads do not send mail',async t=>{const {POST,send,request}=await setup(t);assert.equal((await POST(request({website:'spam'}))).status,400);assert.equal((await POST(request({message:'a'.repeat(17000)}))).status,413);assert.equal(send.mock.callCount(),0)});
test('sixth attempt is rate limited',async t=>{const {POST,request}=await setup(t);for(let i=0;i<5;i++)await POST(request());assert.equal((await POST(request())).status,429)});
