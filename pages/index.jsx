import Layout from '../components/layout';
import { getCookie } from 'cookies-next';
import Link from 'next/link';

export default function HomePage({ username }) {
    return (
        <Layout pageTitle="Home">
            {username ? (
                <>
                    <h3>Hi {username}</h3>
                    <Link href="/chatbot">
                        <button className="button">ChatBot</button>
                    </Link><br/>
                    <Link href="/api/logout">
                        <button className="button">Logout</button>
                    </Link>
                </>
            ) : (
                <>
                    <h2>Welcome to Buddy</h2>
                    <h3>Your friendly, intelligent assistant for all your needs!</h3>
                    <div className="button-container">
                        <Link href="/login">
                            <button className="button">Login</button>
                        </Link>
                        <Link href="/signup">
                            <button className="button">Signup</button>
                        </Link>
                    </div>
                </>
            )}
            <div className="cubes-container">
                <div className="cube"></div>
                <div className="cube"></div>
                <div className="cube"></div>
                <div className="cube"></div>
                <div className="cube"></div>
                <div className="cube"></div>
            </div>
        </Layout>
    );
}

export async function getServerSideProps(context) {
    const req = context.req;
    const res = context.res;
    let username = getCookie('username', { req, res });
    if (username === undefined) {
        username = false;
    }
    return { props: { username } };
}
