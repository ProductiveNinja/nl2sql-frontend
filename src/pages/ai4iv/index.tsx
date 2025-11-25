import React, { useRef } from 'react';
import AiInterfaceComponent from '../../components/AiInterfaceComponent/AiInterfaceComponent';

const Ai4ivPage: React.FC = () => {
  const resetChatRef = useRef<() => void>(() => {});

  const handleResetChat = () => {
    if (resetChatRef.current) {
      resetChatRef.current();
    }
  };

  return (
    <div>
      <div className="col-md-6 header-bar">
        <h1>
          AI4IV
          <sdx-icon icon-name="icon-ai-chip" aria-hidden="true" gradient />
        </h1>
        <sdx-button theme="secondary" icon-name="icon-new" label="Reset chat" onClick={handleResetChat} />
      </div>
      <div className="col-md-6 offset-md-3">
        <AiInterfaceComponent
          onResetRef={(fn) => {
            resetChatRef.current = fn;
          }}
          endpoint="ai4iv"
        />
      </div>
    </div>
  );
};

export default Ai4ivPage;
