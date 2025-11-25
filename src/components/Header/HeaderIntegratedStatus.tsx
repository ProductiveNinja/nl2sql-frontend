import React, { useEffect } from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';

export const HeaderStatusMounter: React.FC = () => {
  const { status } = useWebSocket(process.env.REACT_APP_WEBSOCKET_BASE_URL || 'ws://localhost:8000/agent');

  useEffect(() => {
    let statusElement: HTMLElement | null = null;
    
    const mountToHeader = () => {
      // Look for the login toggle element specifically
      const loginToggle = document.querySelector('span.toggle.arrow');
      const loginLink = document.querySelector('a[aria-label="login"]');
      const header = document.querySelector('sdx-header');
      
      if (!loginToggle && !loginLink && !header) {
        setTimeout(mountToHeader, 100);
        return;
      }

      // Remove existing status element if it exists
      const existing = document.querySelector('.websocket-status');
      if (existing) {
        existing.remove();
      }

      // Find the best parent container - look for the login's parent container
      let targetContainer = loginToggle?.parentElement || loginLink?.parentElement || header;
      
      // If we found the login toggle, let's insert right before it
      if (loginToggle && targetContainer) {
        // Create new status element
        statusElement = document.createElement('div');
        statusElement.className = 'websocket-status';
        statusElement.style.cssText = `
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border: 1px solid #001155;
          border-radius: 20px;
          background: transparent;
          font-size: 13px;
          font-weight: 500;
          margin-right: 12px;
          vertical-align: middle;
        `;

        // Insert before the login toggle
        targetContainer.insertBefore(statusElement, loginToggle);
      } else if (header) {
        // Fallback: append to header with absolute positioning
        statusElement = document.createElement('div');
        statusElement.className = 'websocket-status';
        statusElement.style.cssText = `
          position: absolute;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          padding: 6px 12px;
          border: 1px solid #001155;
          border-radius: 20px;
          background: transparent;
          z-index: 1000;
          font-size: 13px;
          font-weight: 500;
        `;
        
        header.appendChild(statusElement);
      }

      if (statusElement) {
        updateStatusDisplay();
      }
    };

    const updateStatusDisplay = () => {
      if (!statusElement) return;

      const getStatusConfig = (currentStatus: string) => {
        switch (currentStatus) {
          case 'connected':
            return { text: 'Connected', color: '#00b050' };
          case 'connecting':
            return { text: 'Connecting', color: '#ff8c00' };
          default:
            return { text: 'Disconnected', color: '#e60000' };
        }
      };

      const config = getStatusConfig(status);
      statusElement.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          color: ${config.color};
          white-space: nowrap;
        ">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: currentColor;
            flex-shrink: 0;
          "></div>
          <span>${config.text}</span>
        </div>
      `;
    };

    // Try multiple mounting strategies
    const tryMount = () => {
      mountToHeader();
      
      // If still not mounted, try again with longer delays
      setTimeout(() => {
        if (!document.querySelector('.websocket-status')) {
          mountToHeader();
        }
      }, 1000);
      
      setTimeout(() => {
        if (!document.querySelector('.websocket-status')) {
          mountToHeader();
        }
      }, 2000);
    };

    // Initial mount
    tryMount();

    // Also watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          const hasStatus = document.querySelector('.websocket-status');
          const hasLogin = document.querySelector('span.toggle.arrow') || document.querySelector('a[aria-label="login"]');
          
          if (!hasStatus && hasLogin) {
            setTimeout(mountToHeader, 200);
          }
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Cleanup on unmount
    return () => {
      observer.disconnect();
      if (statusElement && statusElement.parentNode) {
        statusElement.parentNode.removeChild(statusElement);
      }
    };
  }, []);

  // Update display when status changes
  useEffect(() => {
    const statusElement = document.querySelector('.websocket-status');
    if (statusElement) {
      const getStatusConfig = (currentStatus: string) => {
        switch (currentStatus) {
          case 'connected':
            return { text: 'Connected', color: '#00b050' };
          case 'connecting':
            return { text: 'Connecting', color: '#ff8c00' };
          default:
            return { text: 'Disconnected', color: '#e60000' };
        }
      };

      const config = getStatusConfig(status);
      statusElement.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          color: ${config.color};
          white-space: nowrap;
        ">
          <div style="
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: currentColor;
            flex-shrink: 0;
          "></div>
          <span>${config.text}</span>
        </div>
      `;
    }
  }, [status]);

  return null;
};