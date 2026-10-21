import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Github, Linkedin, Mail, MapPin, MessageSquare } from 'lucide-react';
import ContactForm from './contact-form';

export const metadata: Metadata = { title: 'Contact — Muhammad Hassan', description: 'Have a project, opportunity, or idea? Get in touch with Muhammad Hassan, Full-Stack AI Engineer.' };

export default function ContactPage() {
  return <>
    <a href="#contact-main" className="skip-link">Skip to contact form</a>
    <header className="header"><Link href="/" className="logo" aria-label="Muhammad Hassan home">mh<span>✳</span></Link><Link href="/" className="back-link"><ArrowLeft size={15}/> Back to portfolio</Link></header>
    <main id="contact-main" className="contact-page">
      <div className="contact-page-intro"><span className="eyebrow">GOOD THINGS START WITH A CONVERSATION</span><h1>Have an idea?<br/><span className="serif">Let’s talk about it.</span></h1><p>A new product, a tricky AI integration, or an opportunity to work together. I’d love to hear what you’re thinking.</p></div>
      <div className="contact-page-grid"><aside className="contact-details"><div className="contact-detail-card"><span className="detail-icon"><Mail size={21}/></span><span className="eyebrow">DROP ME A LINE</span><a href="mailto:mhdhassan.dev@gmail.com">mhdhassan.dev@gmail.com <ArrowUpRight size={16}/></a><p>Prefer email? My inbox is open.</p></div><div className="contact-detail-card"><span className="detail-icon"><MapPin size={21}/></span><span className="eyebrow">BASED IN</span><h2>Lahore, Pakistan</h2><p>Building useful products, wherever the team is.</p></div><div className="conversation-note"><MessageSquare size={20}/><div><h3>A person on the other end.</h3><p>Your message comes straight to me. You’ll also get a confirmation email for your records.</p></div></div><div className="contact-socials"><a href="https://github.com/Hassan-memon009" target="_blank" rel="noreferrer"><Github size={17}/> GitHub <ArrowUpRight size={14}/></a><a href="https://linkedin.com/in/ihassanmemon" target="_blank" rel="noreferrer"><Linkedin size={17}/> LinkedIn <ArrowUpRight size={14}/></a></div></aside><ContactForm/></div>
    </main>
    <footer><Link href="/" className="logo">mh<span>✳</span></Link><p>© {new Date().getFullYear()} Muhammad Hassan</p><Link href="/">Back to portfolio <ArrowUpRight size={14}/></Link></footer>
  </>;
}
