import { useEffect, useState, type FC } from 'react'
import './App.css'
import SocketTester from './components/SocketTester'
import Driver from './components/Driver';
import Chat from './components/Chat';

const Links: FC = () => {
  return (
    <div>
      <ul>
        <li><a href='/customer'>Customer</a></li>
        <li><a href='/driver'>Driver</a></li>
        <li><a href='/chat'>Chat</a></li>
      </ul>
    </div>
  );
}

function App() {

  const [page, setPage] = useState<React.ReactNode>(null);

  useEffect(() => {
    const path = window.location.pathname;

    if (path === '/driver') {
      setPage(<Driver />);
    } else if (path === '/customer') {
      setPage(<SocketTester />)
    } else if (path === '/chat') {
      setPage(<Chat />)
    }
  }, []);

  return (
    <>
      {page || <Links />}
    </>
  )
}

export default App
