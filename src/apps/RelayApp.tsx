import { useRelayStore, RELAY_NODES, relayHeatMultiplier } from '@/store/relayStore'

const TRUST_COLOR = { low: 'text-yellow-400', med: 'text-blue-400', high: 'text-green-400' }
const TRUST_BORDER = { low: 'border-yellow-900/40', med: 'border-blue-900/40', high: 'border-green-900/40' }

export default function RelayApp() {
  const { chain, active, addHop, removeHop, clearChain, setActive } = useRelayStore()

  const heatMult  = relayHeatMultiplier(chain)
  const reduction = Math.round((1 - heatMult) * 100)
  const latencyMs = chain.reduce((sum, id) => {
    const node = RELAY_NODES.find(n => n.id === id)
    return sum + parseInt(node?.latency ?? '0')
  }, 0)

  const available = RELAY_NODES.filter(n => !chain.includes(n.id))

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-200 font-mono text-xs select-none overflow-hidden">

      {/* Header */}
      <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-900 flex items-center gap-2 shrink-0">
        <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-500 animate-pulse' : 'bg-zinc-600'}`} />
        <span className="font-black text-blue-400 tracking-widest">RELAY</span>
        <span className="text-zinc-700">|</span>
        <span className="text-zinc-500 uppercase tracking-wider">Traffic Router</span>
        <div className={`ml-auto text-xs font-bold ${active ? 'text-blue-400' : 'text-zinc-600'}`}>
          {active ? '● ACTIVE' : '○ INACTIVE'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* Chain visualizer */}
        <div className="space-y-1.5">
          <div className="text-zinc-600 uppercase tracking-widest">Active Chain</div>
          <div className="flex items-center gap-1 flex-wrap bg-zinc-900/60 border border-zinc-800 rounded p-2 min-h-[40px]">
            <span className="text-blue-700 text-xs shrink-0">YOU</span>
            {chain.length === 0 ? (
              <span className="text-zinc-700 ml-2">→ [no hops — direct connection]</span>
            ) : (
              chain.map((id, i) => {
                const node = RELAY_NODES.find(n => n.id === id)!
                return (
                  <span key={id} className="flex items-center gap-1">
                    <span className="text-zinc-700">→</span>
                    <button
                      onClick={() => { removeHop(id); setActive(false) }}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-800 border border-blue-900/40 rounded text-blue-300 hover:border-red-700 hover:text-red-400 transition-colors"
                    >
                      {node?.label}
                      <span className="text-zinc-600 text-xs">×</span>
                    </button>
                  </span>
                )
              })
            )}
            {chain.length > 0 && <span className="text-zinc-700">→ TARGET</span>}
          </div>

          {chain.length > 0 && (
            <div className="flex gap-4 px-1">
              <span className="text-zinc-600">
                Heat reduction: <span className={reduction >= 60 ? 'text-green-400' : reduction >= 30 ? 'text-yellow-400' : 'text-zinc-400'}>
                  -{reduction}%
                </span>
              </span>
              <span className="text-zinc-600">
                Added latency: <span className="text-zinc-400">+{latencyMs}ms</span>
              </span>
              <span className="text-zinc-600">
                Hops: <span className="text-zinc-400">{chain.length}</span>
              </span>
            </div>
          )}
        </div>

        {/* Activate / Clear */}
        {chain.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setActive(!active)}
              className={`flex-1 py-2 rounded border font-bold tracking-wider uppercase transition-colors ${
                active
                  ? 'border-red-800 text-red-400 hover:bg-red-950/20'
                  : 'border-blue-800 text-blue-400 hover:bg-blue-950/20'
              }`}
            >
              {active ? '■ DEACTIVATE' : '▶ ACTIVATE RELAY'}
            </button>
            <button
              onClick={clearChain}
              className="px-3 py-2 border border-zinc-800 rounded text-zinc-600 hover:text-zinc-400 hover:border-zinc-600 transition-colors uppercase tracking-wider"
            >
              CLEAR
            </button>
          </div>
        )}

        {active && (
          <div className="border border-blue-900/30 rounded px-3 py-2 bg-blue-950/10 text-xs text-blue-400/70 space-y-0.5">
            <div>Relay active. Terminal operations will benefit from heat reduction.</div>
            <div className="text-blue-900">All traffic routed through {chain.length} hop{chain.length !== 1 ? 's' : ''}.</div>
          </div>
        )}

        {/* Available nodes */}
        <div className="space-y-1.5">
          <div className="text-zinc-600 uppercase tracking-widest">Available Nodes</div>
          <div className="space-y-1">
            {RELAY_NODES.map(node => {
              const inChain = chain.includes(node.id)
              return (
                <div
                  key={node.id}
                  className={`flex items-start gap-3 px-3 py-2 border rounded transition-colors ${
                    inChain ? 'border-blue-900/60 bg-blue-950/10 opacity-50'
                    : !node.up ? 'border-zinc-800/50 opacity-40'
                    : `${TRUST_BORDER[node.trust]} bg-zinc-900/40 hover:bg-zinc-800/40 cursor-pointer`
                  }`}
                  onClick={() => node.up && !inChain && addHop(node.id)}
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${node.up ? 'bg-green-500' : 'bg-red-800'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${!node.up ? 'text-zinc-700' : 'text-zinc-300'}`}>{node.label}</span>
                      <span className={`text-xs uppercase ${TRUST_COLOR[node.trust]}`}>{node.trust}</span>
                      <span className="text-zinc-700 ml-auto">{node.latency}</span>
                    </div>
                    <div className="text-zinc-600 mt-0.5">{node.up ? node.note : 'OFFLINE'}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Guide */}
        <div className="border border-zinc-800/50 rounded px-3 py-2 space-y-1 text-zinc-700">
          <div>Each hop reduces heat generation in Terminal by 25%.</div>
          <div>More hops = safer but slower. Offline nodes are burned.</div>
          <div>Activate before opening Terminal for protection to apply.</div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between shrink-0">
        <span className="text-zinc-700">RELAY // {chain.length} hop{chain.length !== 1 ? 's' : ''} configured</span>
        <span className={active ? 'text-blue-700' : 'text-zinc-700'}>{active ? `−${reduction}% heat` : 'inactive'}</span>
      </div>
    </div>
  )
}
