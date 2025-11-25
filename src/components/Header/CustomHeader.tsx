import React, { useEffect, useRef, useState } from 'react';
import { ConnectionStatusIndicator } from '../ConnectionStatus/ConnectionStatusIndicator';
import { useWebSocket } from '../../hooks/useWebSocket';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'sdx-header': any;
    }
  }
}

export const CustomHeader: React.FC = () => {
  const headerRef = useRef<any>(null);
  const { status } = useWebSocket(process.env.REACT_APP_WEBSOCKET_BASE_URL || 'ws://localhost:8000/agent');
  const [headerLoaded, setHeaderLoaded] = useState(false);

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) return;

    // Configure the SDX header properties
    headerElement.index = JSON.stringify({
      href: './',
    });

    headerElement.login = JSON.stringify({
      login: {
        href: './',
      },
    });

    headerElement.title = 'nl2sql';

    // Wait for header to be fully loaded
    const checkHeaderLoad = () => {
      setTimeout(() => {
        setHeaderLoaded(true);
      }, 1500); // Wait longer for header to fully render
    };

    checkHeaderLoad();
  }, []);

  return (
    <>
      <sdx-header ref={headerRef} />
      {headerLoaded && (
        <>
          <div
            style={{
              position: 'fixed',
              top: '20px',
              left: '20px',
              zIndex: 99999,
              pointerEvents: 'none',
            }}
          >
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>NL2SQL</h1>
          </div>
          <div
            className="websocket-status-fixed"
            style={{
              position: 'fixed',
              top: '16px',
              right: '180px',
              zIndex: 99999,
              background: 'transparent',
              padding: '6px 12px',
              border: '1px solid #001155',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 500,
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ConnectionStatusIndicator status={status} />
          </div>
        </>
      )}
    </>
  );
};
