import React, { useState, useEffect, useRef } from 'react';
import { Terminal, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { McpPacket, McpClientService } from '../services/api';

export const MCPInspector: React.FC = () => {
  const [packets, setPackets] = useState<McpPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<McpPacket | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'tools' | 'bedrock' | 'sse'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const client = McpClientService.getInstance();

  useEffect(() => {
    const unsub = client.subscribePackets((packet) => {
      setPackets((prev) => [packet, ...prev.slice(0, 49)]);
    });
    return unsub;
  }, []);

  const clearLogs = () => {
    setPackets([]);
    setSelectedPacket(null);
  };

  const filteredPackets = packets.filter((p) => {
    if (filterType === 'all') return true;
    if (filterType === 'tools') return p.method?.includes('tools');
    if (filterType === 'bedrock') return JSON.stringify(p.payload).includes('bedrock') || JSON.stringify(p.payload).includes('claude');
    if (filterType === 'sse') return p.method?.includes('stream') || p.method?.includes('notification');
    return true;
  });

  return (
    <div className="double-bezel" style={{ height: '100%' }}>
      <div className="double-bezel-inner" style={{ padding: '20px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={17} color="#007185" strokeWidth={2} />
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
              MCP Streamable HTTP Inspector (Spec 2025-11-25+)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {(['all', 'tools', 'bedrock', 'sse'] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => setFilterType(ft)}
                style={{
                  background: filterType === ft ? 'rgba(0, 113, 133, 0.15)' : 'var(--surface-1)',
                  color: filterType === ft ? '#007185' : 'var(--text-secondary)',
                  border: `1px solid ${filterType === ft ? '#007185' : 'var(--bezel-inner-border)'}`,
                  padding: '3px 9px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  letterSpacing: '0.04em'
                }}
              >
                {ft}
              </button>
            ))}

            <button
              onClick={clearLogs}
              className="btn-island"
              style={{ padding: '4px 8px', fontSize: '10px' }}
              title="Clear packets"
            >
              <Trash2 size={12} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Split View */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', flex: 1, minHeight: '260px' }}>
          
          {/* Packet Stream List */}
          <div 
            ref={scrollRef}
            style={{
              background: 'var(--surface-1)',
              border: '1px solid var(--bezel-inner-border)',
              borderRadius: '12px',
              overflowY: 'auto',
              maxHeight: '340px',
              padding: '8px'
            }}
          >
            {filteredPackets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.5 }}>
                Waiting for Streamable HTTP JSON-RPC packets...<br />
                Trigger any scenario above to observe live tool calls & SSE notifications!
              </div>
            ) : (
              filteredPackets.map((pkt) => {
                const isOutgoing = pkt.direction === 'outgoing';
                const isSelected = selectedPacket?.id === pkt.id;

                return (
                  <div
                    key={pkt.id}
                    onClick={() => setSelectedPacket(pkt)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '8px',
                      marginBottom: '6px',
                      background: isSelected ? 'rgba(0, 113, 133, 0.08)' : 'var(--surface-0)',
                      border: `1.5px solid ${isSelected ? '#007185' : 'var(--bezel-inner-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: isSelected ? '0 2px 6px rgba(0, 113, 133, 0.15)' : '0 1px 2px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {isOutgoing ? (
                        <ArrowUpRight size={14} color="#007185" strokeWidth={2.5} />
                      ) : (
                        <ArrowDownLeft size={14} color="#067d62" strokeWidth={2.5} />
                      )}
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {pkt.method || 'JSON-RPC response'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                          {isOutgoing ? 'POST /mcp' : 'Streamable HTTP SSE'} • {pkt.timestamp}
                        </div>
                      </div>
                    </div>

                    <span className="eyebrow-tag" style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      background: isOutgoing ? 'rgba(0, 113, 133, 0.12)' : 'rgba(6, 125, 98, 0.12)',
                      color: isOutgoing ? '#007185' : '#067d62',
                      border: `1px solid ${isOutgoing ? '#007185' : '#067d62'}`
                    }}>
                      {isOutgoing ? 'REQ' : 'RES'}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Packet Viewer */}
          <div style={{
            background: 'var(--surface-1)',
            border: '1px solid var(--bezel-inner-border)',
            borderRadius: '12px',
            padding: '12px',
            overflowY: 'auto',
            maxHeight: '340px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {selectedPacket ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid var(--bezel-inner-border)', paddingBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#007185' }}>
                    {selectedPacket.method || 'JSON-RPC 2.0 Payload'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {selectedPacket.timestamp}
                  </span>
                </div>
                <pre style={{
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  flex: 1,
                  fontFamily: 'var(--font-mono)'
                }}>
                  {JSON.stringify(selectedPacket.payload, null, 2)}
                </pre>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-secondary)', fontSize: '12px', margin: 'auto', lineHeight: 1.5 }}>
                Select any packet on the left to inspect raw JSON-RPC 2.0 messages & AWS Bedrock metadata.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
