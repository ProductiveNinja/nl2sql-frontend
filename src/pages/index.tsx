import React, { useRef } from 'react';
import Nl2sqlInterface from '../components/Nl2sqlInterface/Nl2sqlInterface';

const HomePage: React.FC = () => {
  const resetChatRef = useRef<() => void>(() => {});
  const sqlRef = useRef<string>('');

  return (
    <div className="container-fluid">
      <div className="row padding-top-2">
        <div className="col-md-10 offset-md-1 padding-top-2">
          <Nl2sqlInterface
            onResetRef={(fn) => {
              resetChatRef.current = fn;
            }}
            onSqlUpdate={(sql) => {
              sqlRef.current = sql;
            }}
            endpoint="nl2sql"
          />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
