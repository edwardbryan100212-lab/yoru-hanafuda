// Online play over WebRTC using PeerJS's free public broker. The host's browser runs the game.
const PREFIX = 'yoruhana-v1-';
const ALPHABET = 'ACDEFGHJKMNPQRTUVWXY34679';

export function makeCode() {
  return Array.from({ length: 4 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
}

export function cleanCode(s) {
  return (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
}

function needPeer() {
  if (!window.Peer) throw new Error('The online library did not load. Check your connection and reload.');
}

// handlers: { onOpen(code), onGuest(conn), onData(msg), onClose(), onError(err) }
export function hostRoom(handlers, code = makeCode(), attempt = 0) {
  needPeer();
  const peer = new window.Peer(PREFIX + code, { debug: 0 });
  let conn = null;
  peer.on('open', () => handlers.onOpen(code));
  peer.on('connection', (c) => {
    if (conn && conn.open) {
      c.on('open', () => { c.send({ t: 'full' }); setTimeout(() => c.close(), 300); });
      return;
    }
    conn = c;
    c.on('open', () => handlers.onGuest(c));
    c.on('data', (m) => handlers.onData(m));
    c.on('close', () => handlers.onClose());
  });
  peer.on('error', (e) => {
    if (e.type === 'unavailable-id' && attempt < 4) {
      peer.destroy();
      hostRoom(handlers, makeCode(), attempt + 1);
      return;
    }
    handlers.onError(e);
  });
  peer.on('disconnected', () => { try { peer.reconnect(); } catch { /* ignore */ } });
  return {
    send: (m) => conn && conn.open && conn.send(m),
    close: () => { try { peer.destroy(); } catch { /* ignore */ } },
  };
}

export function joinRoom(code, handlers) {
  needPeer();
  const peer = new window.Peer({ debug: 0 });
  let conn = null;
  let opened = false;
  const timeout = setTimeout(() => {
    if (!opened) handlers.onError({ type: 'timeout', message: 'No room answered with that code.' });
  }, 15000);
  peer.on('open', () => {
    conn = peer.connect(PREFIX + code, { reliable: true });
    conn.on('open', () => { opened = true; clearTimeout(timeout); handlers.onOpen(conn); });
    conn.on('data', (m) => handlers.onData(m));
    conn.on('close', () => handlers.onClose());
  });
  peer.on('error', (e) => { clearTimeout(timeout); handlers.onError(e); });
  return {
    send: (m) => conn && conn.open && conn.send(m),
    close: () => { clearTimeout(timeout); try { peer.destroy(); } catch { /* ignore */ } },
  };
}
