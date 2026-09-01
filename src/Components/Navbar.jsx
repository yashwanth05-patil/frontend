import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, UserRound, X } from 'lucide-react';
import { AuthContext } from '../Context/AuthContext';

function Navbar() {
    const [isOpen, setOpen] = useState(false);
    const navigate = useNavigate();
    const { auth, logout } = useContext(AuthContext);

    const handleStart = () => {
        if (auth) {
            navigate('/HomePage')
        } else {
            navigate("/register")
        }
    }

    const guestLinks = [
        { name: 'Testimonials', url: '#testimony' },
        { name: 'Contact', url: 'mailto:abdullahmukadam21@gmail.com' },
    ]

    const handleLogout = async () => {
        const res = await logout();
        if (res) navigate("/login")
        setOpen(false)
    };

    return (
        <nav className="relative w-full bg-paper">
            <div className="w-full px-4 py-3 flex items-center justify-between sticky top-0 z-[100] border-b border-slate-line bg-paper/95 backdrop-blur-sm">
                <Link to={auth ? '/HomePage' : '/'} className="flex items-center gap-2 min-h-touch">
                    <span className="font-display text-[1.15rem] tracking-wide text-ink">I&apos;M SAFE</span>
                </Link>

                {!auth && (
                    <div className="hidden md:flex items-center gap-8">
                        {guestLinks.map((item) => (
                            <a key={item.name} className="text-caption text-ink-soft hover:text-dusk transition-colors duration-page" href={item.url}>
                                {item.name}
                            </a>
                        ))}
                    </div>
                )}

                <div className="flex items-center justify-end gap-2">
                    {auth ? (
                        <Link
                            to="/profile"
                            className="hidden md:inline-flex items-center gap-2 min-h-touch min-w-touch rounded-pill border border-slate-line bg-paper-raised px-3 text-caption text-ink hover:border-dusk"
                            aria-label="Profile"
                        >
                            <UserRound className="w-4 h-4" />
                            Profile
                        </Link>
                    ) : (
                        <button type="button" className="hidden md:inline-flex btn-primary" onClick={handleStart}>
                            Get started
                        </button>
                    )}

                    <button
                        className="relative w-11 h-11 focus:outline-none md:hidden rounded-btn"
                        onClick={() => setOpen(!isOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isOpen}
                    >
                        {isOpen ? <X className="w-5 h-5 mx-auto text-ink" /> : <Menu className="w-5 h-5 mx-auto text-ink" />}
                    </button>
                </div>
            </div>

            <div className={`absolute w-full bg-paper-raised border-b border-slate-line md:hidden z-50 transition-all duration-page ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
                <div className="flex flex-col gap-2 p-4">
                    {!auth && guestLinks.map((item) => (
                        <a key={item.name} className="min-h-touch flex items-center text-body text-ink-soft" href={item.url} onClick={() => setOpen(false)}>
                            {item.name}
                        </a>
                    ))}
                    {auth && (
                        <Link to="/profile" className="min-h-touch flex items-center text-body text-ink" onClick={() => setOpen(false)}>
                            Profile
                        </Link>
                    )}
                    {auth ? (
                        <button type="button" className="btn-secondary w-full" onClick={handleLogout}>
                            Log out
                        </button>
                    ) : (
                        <button type="button" className="btn-primary w-full" onClick={() => { handleStart(); setOpen(false); }}>
                            Get started
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
