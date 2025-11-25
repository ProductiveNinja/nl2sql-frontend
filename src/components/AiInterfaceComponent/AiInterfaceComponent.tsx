import { ChangeEvent, useEffect, useState } from 'react';
import axios from 'axios';

type Message = {
  sender: 'user' | 'bot';
  text: string;
};

function ChatBoxComponent({ text }: { text: string }) {
  return (
    <div className="row">
      <div className="container-fluid margin-bottom-3 col-md-7">
        <div className="row">
          <div className="col-md-12">
            <h3>
              <sdx-icon icon-name="icon-ai-chip" aria-hidden="true" gradient /> AI
            </h3>
          </div>
        </div>
        <div className="row">
          <div className="response-chat-bubble">{text}</div>
        </div>
      </div>
    </div>
  );
}

function UserChatBoxComponent({ text }: { text: string }) {
  return (
    <div className="row flex-items-xs-right">
      <div className="container-fluid margin-bottom-3 col-xs-7">
        <div className="row">
          <div className="col-md-12">
            <h3 className="text-align-right">
              <sdx-icon icon-name="icon-smiley-sunglasses" aria-hidden="true" gradient /> USER
            </h3>
          </div>
        </div>
        <div className="row flex-items-xs-right">
          <div className="request-chat-bubble">{text}</div>
        </div>
      </div>
    </div>
  );
}

type Props = {
  onResetRef?: (resetFn: () => void) => void;
  endpoint: string;
};

export default function AiInterfaceComponent({ onResetRef, endpoint }: Props) {
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (onResetRef) {
      onResetRef(resetChat);
    }
  }, [onResetRef]);

  useEffect(() => {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  const resetChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const handleSendRequest = async () => {
    if (!userInput.trim()) return;

    const updatedMessages: Message[] = [...messages, { sender: 'user', text: userInput }];
    setMessages(updatedMessages);
    setUserInput('');

    try {
      const response = await axios.post('http://127.0.0.1:5001/api/' + endpoint + '/query', {
        query: userInput,
      });

      const { sql_query } = response.data;

      const botText = `${sql_query}`;

      setMessages((prev) => [...prev, { sender: 'bot', text: botText }]);
    } catch (error: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: '❌ An error occurred while sending the request. Please check your API login.',
        },
      ]);
      console.error(error);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLSdxInputElement>) => {
    setUserInput(event.target.value);
  };

  return (
    <div className="container-fluid" style={{ minHeight: '100vh', paddingBottom: '70px' }}>
      <div className="table-generic col-md-12">
        <div className="table-wrapper">
          {messages.map((msg, index) =>
            msg.sender === 'user' ? (
              <UserChatBoxComponent key={index} text={msg.text} />
            ) : (
              <ChatBoxComponent key={index} text={msg.text} />
            ),
          )}
        </div>
      </div>
      <div className="chat-input-bar-1">
        <div className="row">
          <div className="col-md-9">
            <sdx-input placeholder="Send a message..." value={userInput} type="textarea" onInput={handleInputChange} />
          </div>
          <div className="col-md-3 flex-xs-middle">
            <sdx-button-group layout="fill">
              <sdx-button icon-name="icon-send" label="Send" onClick={handleSendRequest} />
            </sdx-button-group>
          </div>
        </div>
      </div>
    </div>
  );
}
