import React, { useEffect, useState, useRef } from 'react';
import ResultTable from '../ResultTable/ResultTable';
import styles from './Nl2sqlInterface.module.css';
import { useWebSocket, ConnectionStatus } from '../../hooks/useWebSocket';
import ChartComponent from '../Chart/ChartComponent';

// Register Chart.js components on client-side only
if (typeof window !== 'undefined') {
  import('chart.js').then(({ Chart, registerables }) => {
    Chart.register(...registerables);
  });
}

type ResultItem = { [key: string]: string | number | null };
type ChartType = 'table' | 'bargraph' | 'linegraph' | 'pie' | 'sql_query';

type ResponseData = {
  sql_query: string;
  result: ResultItem[];
  chart_type?: string;
  type?: string;
  columns?: string[]; // Backend provided column order
  error?: string;
};

type ChatMessage = {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'error' | 'system';
  isLoading?: boolean;
  data?: ResponseData;
  chartType?: ChartType;
  streamingContent?: string; // For accumulating streaming responses
};

// WebSocket message types based on documentation
type WebSocketMessage = {
  event: string;
  setting: Record<string, any>;
  data: Record<string, any>;
};

type Props = {
  onResetRef?: (resetFn: () => void) => void;
  onSqlUpdate?: (sql: string) => void;
  endpoint: string;
  websocketUrl?: string; // Add WebSocket URL prop
};

// Type for custom element with value
interface CustomElementWithValue extends HTMLElement {
  value: string;
}

// Creates more readable display names for chart types
const get_chart_type_display_name = (chartType: ChartType): string => {
  const display_names: Record<ChartType, string> = {
    table: 'Table View',
    bargraph: 'Bar Chart',
    linegraph: 'Line Chart',
    pie: 'Pie Chart',
    sql_query: 'SQL Query',
  };
  return display_names[chartType] || chartType;
};

// Function moved outside component to be shared
const get_valid_chart_types = (result: ResultItem[]): ChartType[] => {
  if (!result || !result.length) return ['table', 'sql_query'];

  const cols = Object.keys(result[0]).length;
  if (cols === 1 || cols > 3 || result.length === 1) return ['table', 'sql_query'];
  if (cols === 2) return ['table', 'bargraph', 'linegraph', 'pie', 'sql_query'];
  if (cols === 3) return ['table', 'bargraph', 'linegraph', 'sql_query'];
  return ['table', 'sql_query'];
};

// Simple chart selector component with standard HTML select
const ChartSelector: React.FC<{
  data: ResultItem[];
  messageId: string;
  currentChartType: ChartType;
  onChartTypeChange: (messageId: string, chartType: ChartType) => void;
}> = ({ data, messageId, currentChartType, onChartTypeChange }) => {
  const valid_chart_types = get_valid_chart_types(data);

  const handle_select_change = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected_value = e.target.value as ChartType;
    if (valid_chart_types.includes(selected_value)) {
      onChartTypeChange(messageId, selected_value);
    }
  };

  return (
    <div className={styles.visualization_select_wrapper}>
      <select className={styles.visualization_select} value={currentChartType} onChange={handle_select_change}>
        {valid_chart_types.map((type) => (
          <option key={type} value={type}>
            {get_chart_type_display_name(type)}
          </option>
        ))}
      </select>
    </div>
  );
};

// Extract message components to avoid React hooks errors
const ChatMessageView: React.FC<{
  message: ChatMessage;
  renderDataVisualizer: (data: ResponseData, messageId: string, chartType?: ChartType) => React.ReactNode;
}> = ({ message, renderDataVisualizer }) => {
  if (message.isLoading) {
    return (
      <div key={message.id} className={styles.loading_container}>
        <sdx-loading-spinner></sdx-loading-spinner>
      </div>
    );
  }

  return (
    <div
      key={message.id}
      className={`${styles.message} ${
        message.type === 'user'
          ? styles.user_message
          : message.type === 'error'
            ? styles.error_message
            : message.type === 'system'
              ? styles.system_message
              : styles.assistant_message
      }`}
    >
      {message.content && (
        <div className={styles.message_content}>
          <p className="text-standard">{message.content}</p>
        </div>
      )}
      {message.data && renderDataVisualizer(message.data, message.id, message.chartType)}
    </div>
  );
};

export default function Nl2sqlInterface({
  onResetRef,
  onSqlUpdate,
  endpoint,
  websocketUrl = process.env.REACT_APP_WEBSOCKET_BASE_URL || 'ws://localhost:8000/agent',
}: Props) {
  const [user_input, set_user_input] = useState('');
  const [messages, set_messages] = useState<ChatMessage[]>([]);
  const chat_container_ref = useRef<HTMLDivElement>(null);
  const current_response_id = useRef<string | null>(null);

  // State for settings
  const [selected_model, set_selected_model] = useState<string | null>(null);
  const [selected_database, set_selected_database] = useState<string | null>(null);

  // Use WebSocket hook
  const { status: wsStatus, sendMessage, lastMessage } = useWebSocket(websocketUrl);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    try {
      const message: WebSocketMessage = JSON.parse(lastMessage);
      console.log('WebSocket message received:', message);

      switch (message.event) {
        case 'prompt':
          handlePromptMessage(message);
          break;
        case 'error':
          handleErrorMessage(message);
          break;
        case 'db_result':
          handleDbResultMessage(message);
          break;
        case 'system':
          handleSystemMessage(message);
          break;
        case 'completion':
          handleCompletionMessage(message);
          break;
        default:
          console.log('Unhandled message type:', message.event);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error, lastMessage);
    }
  }, [lastMessage]);

  const handlePromptMessage = (message: WebSocketMessage) => {
    const { setting, data } = message;
    const isStreaming = setting.stream === true;
    const messageContent = data.message || '';

    if (!current_response_id.current) return;

    set_messages((prev) =>
      prev.map((msg) => {
        if (msg.id === current_response_id.current) {
          if (isStreaming) {
            // Accumulate streaming content
            const currentContent = msg.streamingContent || '';
            return {
              ...msg,
              streamingContent: currentContent + messageContent,
              content: currentContent + messageContent,
              isLoading: true,
            };
          } else {
            // Complete response
            return {
              ...msg,
              content: messageContent,
              isLoading: false,
            };
          }
        }
        return msg;
      }),
    );
  };

  const handleErrorMessage = (message: WebSocketMessage) => {
    const { data } = message;
    if (!current_response_id.current) return;

    set_messages((prev) =>
      prev.map((msg) => {
        if (msg.id === current_response_id.current) {
          return {
            ...msg,
            content: data.message || 'An error occurred',
            type: 'error',
            isLoading: false,
          };
        }
        return msg;
      }),
    );
  };

  const handleDbResultMessage = (message: WebSocketMessage) => {
    const { data } = message;
    if (!current_response_id.current) return;

    const responseData: ResponseData = {
      sql_query: data.sql_query,
      result: data.rows || [],
      columns: data.columns?.map((col: any) => col.name) || Object.keys(data.rows?.[0] || {}),
      chart_type: 'table',
    };

    // Normalize result data
    if (responseData.result && responseData.result.length > 0) {
      responseData.result = normalize_result(responseData.result, responseData.columns);
    }

    const valid_chart_types = get_valid_chart_types(responseData.result);
    const default_chart_type = get_default_chart_type(responseData.result, valid_chart_types, responseData.chart_type);

    set_messages((prev) =>
      prev.map((msg) => {
        if (msg.id === current_response_id.current) {
          return {
            ...msg,
            content: '', // Don't show content, just the data visualization
            type: 'assistant',
            data: responseData,
            chartType: default_chart_type,
            isLoading: false,
          };
        }
        return msg;
      }),
    );

    // Update SQL query if callback provided
    onSqlUpdate?.(data.sql_query);
  };

  const handleSystemMessage = (message: WebSocketMessage) => {
    const { data } = message;
    const systemMsgId = Date.now().toString();

    set_messages((prev) => [
      ...prev,
      {
        id: systemMsgId,
        content: data.message,
        type: 'system',
      },
    ]);
  };

  const handleCompletionMessage = (message: WebSocketMessage) => {
    const { data } = message;
    if (current_response_id.current) {
      set_messages((prev) =>
        prev.map((msg) => {
          if (msg.id === current_response_id.current) {
            return {
              ...msg,
              isLoading: false,
            };
          }
          return msg;
        }),
      );
      current_response_id.current = null;
    }
  };

  // Scroll to bottom function
  const scroll_to_bottom = (smooth = true) => {
    if (chat_container_ref.current) {
      chat_container_ref.current.scrollTo({
        top: chat_container_ref.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Scroll whenever messages change
  useEffect(() => {
    scroll_to_bottom();
  }, [messages]);

  const handle_send_request = async () => {
    if (!user_input.trim()) return;
    if (wsStatus !== 'connected') {
      console.warn('WebSocket is not connected');
      return;
    }

    const input = user_input.trim();
    set_user_input('');

    // Add user message to chat
    const msg_id = Date.now().toString();
    const response_id = `${msg_id}-response`;
    current_response_id.current = response_id;

    set_messages((prev) => [
      ...prev,
      { id: msg_id, content: input, type: 'user' },
      { id: response_id, content: '', type: 'assistant', isLoading: true },
    ]);

    // Immediate scroll when sending
    setTimeout(() => scroll_to_bottom(), 50);

    try {
      // Send structured message via WebSocket
      const webSocketMessage: any = {
        query: input,
      };

      // Add config object if any settings are selected
      if (selected_database !== null || selected_model !== null) {
        const config: Record<string, string> = {};
        if (selected_database !== null) {
          config.DATABASE = selected_database;
        }
        if (selected_model !== null) {
          config.LLM_BACKEND = selected_model;
        }
        webSocketMessage.config = config;
      }

      const messageJson = JSON.stringify(webSocketMessage);
      console.log('Sent WebSocket message (JSON):', messageJson);
      console.log('Sent WebSocket message (Object):', webSocketMessage);
      sendMessage(messageJson);
    } catch (err) {
      console.error('Error sending WebSocket message:', err);
      // Replace loading message with error
      set_messages((prev) =>
        prev.map((msg) =>
          msg.id === response_id
            ? {
                id: msg.id,
                content: '❌ An error occurred while sending your request.',
                type: 'error',
                isLoading: false,
              }
            : msg,
        ),
      );
      current_response_id.current = null;
    }
  };

  const normalize_result = (rows: Record<string, unknown>[], column_order?: string[]): ResultItem[] => {
    if (!rows.length) return [];

    // If no explicit column order from backend, use keys from first row
    const order = column_order || Object.keys(rows[0]);

    console.log('Using column order:', order);

    return rows.map((row) => {
      const normalized: ResultItem = {};
      // Use the column order to maintain sequence
      for (const key of order) {
        const val = row[key];
        normalized[key] =
          val && typeof val === 'object' && 'valueOf' in val ? Number(val) : (val as string | number | null);
      }
      return normalized;
    });
  };

  const is_year_revenue_data = (data: ResultItem[]) => {
    if (!data.length || Object.keys(data[0]).length !== 2) return false;
    const keys = Object.keys(data[0]);
    const has_year = keys.find(
      (k) => k.toLowerCase().includes('year') || data.every((r) => Number(r[k]) >= 1900 && Number(r[k]) <= 2100),
    );
    const has_metric = keys.find((k) => /revenue|income|sales|profit/i.test(k));
    return Boolean(has_year && has_metric);
  };

  const get_default_chart_type = (data: ResultItem[], valid: ChartType[], backend_type?: string): ChartType => {
    const type = backend_type?.toLowerCase() as ChartType;
    if (type && valid.includes(type)) return type;
    if (valid.includes('linegraph') && is_year_revenue_data(data)) return 'linegraph';
    return valid.includes('bargraph') ? 'bargraph' : valid[0];
  };

  const reset = () => {
    set_messages([]);
  };

  useEffect(() => {
    if (onResetRef) onResetRef(reset);
  }, [onResetRef]);

  const handle_chart_type_change = (messageId: string, chartType: ChartType) => {
    console.log(`Changing chart type for message ${messageId} to ${chartType}`);
    set_messages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, chartType } : msg)));
  };

  const render_data_visualizer = (data: ResponseData, messageId: string, chartType: ChartType = 'table') => {
    if (!data.result || data.result.length === 0) return null;

    const copy_sql_to_clipboard = () => {
      navigator.clipboard
        .writeText(data.sql_query)
        .then(() => {
          console.log('SQL query copied to clipboard');
          // Show toast notification
          const header = document.querySelector('sdx-header');
          if (header?.showToast) {
            header.showToast({
              description: 'SQL copied',
              type: 'confirmation',
            });
          }
        })
        .catch((err) => {
          console.error('Failed to copy SQL query: ', err);
          // Show error toast
          const header = document.querySelector('sdx-header');
          if (header?.showToast) {
            header.showToast({
              description: 'Failed to copy SQL',
              type: 'warning',
            });
          }
        });
    };

    return (
      <div className={styles.result_wrapper} onLoad={() => scroll_to_bottom()}>
        <ChartSelector
          data={data.result}
          messageId={messageId}
          currentChartType={chartType}
          onChartTypeChange={handle_chart_type_change}
        />
        <div className={styles.result_container}>
          {chartType === 'sql_query' ? (
            <div className={`${styles.sql_query_container} text-standard`}>
              <div className={styles.sql_copy_button} onClick={copy_sql_to_clipboard} title="Copy SQL Query">
                <sdx-icon icon-name="icon-copy" size={3} sr-hint="Copy SQL Query"></sdx-icon>
              </div>
              <code>{data.sql_query}</code>
            </div>
          ) : chartType === 'table' ? (
            <ResultTable data={data.result} columnOrder={data.columns} onLoad={() => scroll_to_bottom()} />
          ) : (
            <div className={styles.chart_container}>
              <ChartComponent
                data={data.result}
                chartType={chartType}
                columnOrder={data.columns}
                onRender={() => scroll_to_bottom()}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Handle input change with type safety
  const handle_input_change = (event: Event) => {
    const target = event.target as CustomElementWithValue;
    if (!target) return;
    set_user_input(target.value);
  };

  // Handle Enter key press
  const handle_key_press = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handle_send_request();
    }
  };

  useEffect(() => {
    // Add event listener for custom elements
    const input_element = document.querySelector('sdx-input');
    if (input_element) {
      input_element.addEventListener('keydown', handle_key_press);
    }

    return () => {
      // Clean up event listener
      if (input_element) {
        input_element.removeEventListener('keydown', handle_key_press);
      }
    };
  }, [user_input]);

  return (
    <div className={styles.container}>
      <div className={styles.chat_container} ref={chat_container_ref}>
        {messages.map((message) => (
          <ChatMessageView key={message.id} message={message} renderDataVisualizer={render_data_visualizer} />
        ))}
      </div>
      <div className={styles.input_container}>
        <div className={styles.input_wrapper}>
          <sdx-dialog id="overview-modal-example" label="Settings">
            <sdx-dialog-toggle>
              <sdx-icon icon-name="icon-settings" size={3} sr-hint="Settings"></sdx-icon>
            </sdx-dialog-toggle>

            <sdx-dialog-content>
              <sdx-select
                keyboard-behavior="filter"
                label="What model do you want to use?"
                placeholder="Choose your Model…"
                filter-min-length="2"
                // @ts-expect-error - Custom element events not in standard React types
                oninput={(e: any) => {
                  const value = Array.isArray(e.target.value) ? e.target.value[0] : e.target.value;
                  set_selected_model(value);
                }}
              >
                <sdx-select-option value="aws">Anthropic Claude Sonnet 3.5</sdx-select-option>
                <sdx-select-option value="gpt_oss">Openai gpt-oss-120b</sdx-select-option>
              </sdx-select>
              <br />
              <sdx-select
                keyboard-behavior="filter"
                label="What Database do you want to use?"
                placeholder="Choose your Database…"
                filter-min-length="2"
                // @ts-expect-error - Custom element events not in standard React types
                oninput={(e: any) => {
                  const value = Array.isArray(e.target.value) ? e.target.value[0] : e.target.value;
                  set_selected_database(value);
                }}
              >
                <sdx-select-option value="inventory_vega">Inventory Vega</sdx-select-option>
                <sdx-select-option value="sakila">Sakila</sdx-select-option>
              </sdx-select>
              <br />
              <sdx-button-group>
                <sdx-button
                  label="Save"
                  // @ts-expect-error - Custom element events not in standard React types
                  onclick={() => {
                    if (selected_database !== null) {
                      console.log(`DATABASE:${selected_database}`);
                    }
                    if (selected_model !== null) {
                      console.log(`LLM_BACKEND:${selected_model}`);
                    }
                    (document.getElementById('overview-modal-example') as any)?.close();
                  }}
                ></sdx-button>
                <sdx-button
                  id="first-action-element"
                  label="Cancel"
                  // @ts-expect-error - Custom element events not in standard React types
                  onclick={() => (document.getElementById('overview-modal-example') as any)?.close()}
                  theme="secondary"
                ></sdx-button>
              </sdx-button-group>
            </sdx-dialog-content>
          </sdx-dialog>
          <sdx-input
            placeholder="Send a message..."
            value={user_input}
            type="textarea"
            disabled={wsStatus !== 'connected'}
            // @ts-expect-error - Custom element events not in standard React types
            onInput={handle_input_change}
          />
          <sdx-button-group layout="fill">
            <sdx-button
              icon-name="icon-send"
              label="Send"
              onClick={handle_send_request}
              disabled={wsStatus !== 'connected'}
            />
          </sdx-button-group>
        </div>
      </div>
    </div>
  );
}
