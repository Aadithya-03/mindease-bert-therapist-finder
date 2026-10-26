import { Link } from 'react-router-dom';
import { PAGES } from '../pages';
import { useAuth } from '../context/AuthContext';

const BLURBS = {
  '/chatbot': 'Chat about your day. Each message is read for mood, and you will be nudged toward help if it seems needed.',
  '/therapist': 'A guided session with breathing, grounding and thought tools, plus a quick mood check-in.',
  '/voice': 'Speak to MindEase and hear it answer back, hands-free.',
  '/mind-check': 'Write freely, add two short questionnaires, and see whether a therapist could help.',
  '/nearby': 'See psychiatrists, psychologists, counsellors and hospitals on a map near you.',
  '/emergency': 'Helplines and quick calming tools for hard moments.',
  '/history': 'Review past check-ins and conversations, or delete everything.',
};

export default function Home() {
  const { user } = useAuth();
  const name = (user?.displayName || user?.email || '').split(/[ @]/)[0];
  return (
    <>
      <section className="card hero">
        <h2>Hi{name ? `, ${name}` : ''}. How are you, really?</h2>
        <p>Start by talking it out, or take the Mind Check for a clearer picture of whether extra support would help.</p>
        <div className="row">
          <Link className="btn btn-primary" to="/chatbot">Talk to the chatbot</Link>
          <Link className="btn" to="/mind-check">Take the Mind Check</Link>
        </div>
      </section>

      <div className="grid">
        {PAGES.filter((p) => BLURBS[p.path]).map(({ path, label, icon: Icon }) => (
          <Link key={path} to={path} className={`card module ${path === '/emergency' ? 'module-urgent' : ''}`}>
            <span className="avatar"><Icon size={22} aria-hidden /></span>
            <h3>{label}</h3>
            <p>{BLURBS[path]}</p>
          </Link>
        ))}
      </div>

      <p className="fine">MindEase offers support and screening, not diagnosis or treatment. In an emergency, call your local emergency number.</p>
    </>
  );
}
