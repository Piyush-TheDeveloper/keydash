'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/lib/store'
import { DIFFICULTIES, WORD_COUNTS } from '@/lib/config'

type Mode = 'menu' | 'waiting'

export default function Lobby() {
  const {
    difficulty,
    wordCount,
    playerName,
    players,
    isHost,
    setDifficulty,
    setWordCount,
    setPlayerName,
    initLocalRace,
    startCountdown,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useStore()
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [creating, setCreating] = useState(false)
  const [mode, setMode] = useState<Mode>('menu')
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [nameError, setNameError] = useState(false)

  const SUGGESTED_NAMES = [
    'ShadowTyper',
    'NeonFingers',
    'KeyPhantom',
    'VoltStrike',
    'CyberPulse',
  ]

  const validateName = (): boolean => {
    if (!playerName.trim()) {
      setNameError(true)
      return false
    }
    setNameError(false)
    return true
  }

  const quickPlay = () => {
    if (!validateName()) return
    initLocalRace(false)
    startCountdown()
  }

  const handleCreate = async () => {
    if (!validateName()) return
    setError('')
    setCreating(true)
    initLocalRace(true)
    const code = await createRoom()
    setCreating(false)
    if (code) {
      setGeneratedCode(code)
      setMode('waiting')
    } else {
      setError(
        'Supabase not configured. Set up .env.local first (see README), or use Quick Play for bot races.',
      )
    }
  }

  const handleJoin = async () => {
    if (!validateName()) return
    if (joinCode.length < 4) {
      setError('Enter a valid room code')
      return
    }
    setError('')
    setJoining(true)
    const ok = await joinRoom(joinCode)
    setJoining(false)
    if (ok) {
      setMode('waiting')
      setGeneratedCode(joinCode.toUpperCase())
    } else {
      setError('Room not found or already started.')
    }
  }

  const startFromWaiting = () => {
    startCountdown()
  }
  const backToMenu = () => {
    leaveRoom()
    setMode('menu')
    setGeneratedCode(null)
    setError('')
  }
  const copyCode = () => {
    if (generatedCode) navigator.clipboard.writeText(generatedCode)
  }

  // Human players in the room (for waiting room display)
  const humanPlayers = players.filter((p) => p.type === 'human')

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className='text-center mb-7 pt-5'>
        <h1 className='text-[48px] font-extrabold tracking-[-2.5px] text-white font-display'>
          KEY<span className='text-accent'>DASH</span>
        </h1>
        <p className='font-mono text-[11px] text-txt-3 tracking-[3px] uppercase mt-1.5'>
          real-time typing race
        </p>
      </div>

      <AnimatePresence mode='wait'>
        {/* ===== MAIN MENU ===== */}
        {mode === 'menu' && (
          <motion.div
            key='menu'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className='bg-bg-2/65 backdrop-blur-2xl border border-bg-6/45 rounded-[20px] p-7 max-w-[540px] mx-auto'>
              <label className='block font-mono text-[10px] text-txt-2 uppercase tracking-[2px] font-medium mb-2.5'>
                Your name
              </label>
              <input
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value)
                  if (e.target.value.trim()) setNameError(false)
                }}
                placeholder='Enter racer name...'
                maxLength={20}
                className={`w-full bg-bg-1 border-[1.5px] rounded-xl px-4 py-3 text-txt-1 font-mono text-sm outline-none placeholder:text-txt-g transition-all ${nameError ? 'border-neon-red/60 shadow-[0_0_0_3px_rgba(231,76,60,0.08)]' : 'border-bg-6/50 focus:border-accent/45 focus:shadow-[0_0_0_3px_rgba(230,126,34,0.06)]'}`}
              />
              {nameError && (
                <p className='font-mono text-[11px] text-neon-red mt-1.5 mb-1'>
                  Please enter a name or pick one below
                </p>
              )}
              {!playerName.trim() && (
                <div className='flex flex-wrap gap-1.5 mt-2 mb-5'>
                  {SUGGESTED_NAMES.map((n) => (
                    <button
                      key={n}
                      onClick={() => {
                        setPlayerName(n)
                        setNameError(false)
                      }}
                      className='font-mono text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-bg-6/30 bg-bg-1/50 text-txt-3 hover:text-accent hover:border-accent/30 hover:bg-accent/5 active:scale-95 transition-all'
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
              {playerName.trim() && <div className='mb-5' />}

              <label className='block font-mono text-[10px] text-txt-2 uppercase tracking-[2px] font-medium mb-2.5'>
                Difficulty
              </label>
              <div className='grid grid-cols-2 gap-2.5 mb-6'>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDifficulty(d.key)}
                    className={`text-left rounded-xl p-3.5 border-[1.5px] transition-all relative overflow-hidden hover:-translate-y-px hover:shadow-lg ${difficulty === d.key ? '' : 'border-bg-6/35 bg-bg-1/50 hover:bg-bg-3/70'}`}
                    style={
                      difficulty === d.key
                        ? { borderColor: d.color, background: d.glow }
                        : {}
                    }
                  >
                    {difficulty === d.key && (
                      <span
                        className='absolute top-3.5 right-3.5 w-[7px] h-[7px] rounded-full'
                        style={{ background: d.color }}
                      />
                    )}
                    <span
                      className='block text-sm font-bold'
                      style={{
                        color: difficulty === d.key ? d.color : '#f0ece4',
                      }}
                    >
                      {d.label}
                    </span>
                    <span className='block text-[11px] text-txt-3 mt-0.5'>
                      {d.sub}
                    </span>
                    <span className='block font-mono text-[10px] text-txt-g mt-1'>
                      {d.wpmRange}
                    </span>
                  </button>
                ))}
              </div>

              <label className='block font-mono text-[10px] text-txt-2 uppercase tracking-[2px] font-medium mb-2.5'>
                Word count
              </label>
              <div className='flex gap-2 mb-7'>
                {WORD_COUNTS.map((w) => (
                  <button
                    key={w}
                    onClick={() => setWordCount(w)}
                    className={`flex-1 py-2.5 rounded-[10px] font-mono text-[13px] font-semibold border-[1.5px] transition-all ${wordCount === w ? 'bg-accent-glow text-accent border-accent/25' : 'border-bg-6/30 bg-bg-1/50 text-txt-3 hover:text-txt-2 hover:border-bg-7'}`}
                  >
                    {w}
                  </button>
                ))}
              </div>

              <div className='flex gap-3 mb-3'>
                <button
                  onClick={quickPlay}
                  className='flex-1 py-4 rounded-[14px] bg-gradient-to-br from-accent-dark via-accent to-accent-light text-white text-[15px] font-bold relative overflow-hidden shadow-[0_4px_24px_rgba(230,126,34,0.2)] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(230,126,34,0.3)] active:scale-[0.98] transition-all group'
                >
                  <span className='relative z-10'>⚡ Quick Play</span>
                  <span className='absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent -translate-x-full group-hover:animate-shimmer' />
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className='flex-1 py-4 rounded-[14px] bg-gradient-to-br from-[#2563eb] via-neon-blue to-[#60a5fa] text-white text-[15px] font-bold relative overflow-hidden shadow-[0_4px_24px_rgba(74,158,255,0.2)] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(74,158,255,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 group'
                >
                  <span className='relative z-10'>
                    {creating ? 'Creating...' : '🌐 Create Room'}
                  </span>
                  <span className='absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.12] to-transparent -translate-x-full group-hover:animate-shimmer' />
                </button>
              </div>
              <div className='flex items-center justify-center gap-4 mb-3'>
                <span className='font-mono text-[12px] text-txt-3'>
                  <span className='text-xl'>⚡️</span> Solo race with AI bots
                </span>
                <span className='text-txt-g'>·</span>
                <span className='font-mono text-[12px] text-txt-3'>
                  <span className='text-xl'>🌐</span> Race with real friends
                </span>
              </div>
              {error && (
                <div className='bg-neon-red/10 border border-neon-red/20 rounded-xl px-4 py-3 mb-3'>
                  <p className='font-mono text-xs text-neon-red'>{error}</p>
                </div>
              )}
              <p className='text-center font-mono text-[10px] text-txt-g tracking-[0.5px]'>
                Anti-cheat · Performance analytics · Replay system
              </p>
            </div>

            <div className='max-w-[540px] mx-auto mt-4 bg-bg-2/45 border border-bg-6/30 rounded-2xl p-4'>
              <label className='block font-mono text-[10px] text-txt-2 uppercase tracking-[2px] font-medium mb-2.5'>
                Join a friend&apos;s room
              </label>
              <div className='flex gap-2.5 items-center'>
                <input
                  value={joinCode}
                  onChange={(e) => {
                    setJoinCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  placeholder='Enter 6-digit room code...'
                  maxLength={6}
                  className='flex-1 bg-bg-1 border-[1.5px] border-bg-6/40 rounded-[10px] px-3.5 py-2.5 text-txt-1 font-mono text-[13px] outline-none text-center tracking-[3px] uppercase placeholder:text-txt-g placeholder:tracking-normal placeholder:normal-case focus:border-neon-blue/50 transition-all'
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className='px-5 py-2.5 rounded-[10px] bg-neon-blue text-white font-bold text-[13px] hover:bg-[#5ca8ff] hover:-translate-y-px transition-all disabled:opacity-50'
                >
                  {joining ? '...' : 'JOIN'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ===== WAITING ROOM ===== */}
        {mode === 'waiting' && (
          <motion.div
            key='waiting'
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className='bg-bg-2/65 backdrop-blur-2xl border border-bg-6/45 rounded-[20px] p-7 max-w-[540px] mx-auto text-center'>
              {/* Room Code */}
              <div className='mb-6'>
                <p className='font-mono text-[10px] text-txt-2 uppercase tracking-[2px] mb-3'>
                  {isHost ? 'Share this code with friends' : 'You joined room'}
                </p>
                <div className='flex items-center justify-center gap-3'>
                  <div className='bg-bg-1 border-2 border-accent/30 rounded-2xl px-8 py-4'>
                    <span className='font-mono text-[36px] font-bold text-accent tracking-[8px]'>
                      {generatedCode}
                    </span>
                  </div>
                  <button
                    onClick={copyCode}
                    className='px-4 py-3 rounded-xl bg-bg-5 border border-bg-6/40 text-txt-2 font-mono text-xs font-bold hover:bg-bg-4 hover:text-txt-1 active:scale-95 transition-all'
                  >
                    📋 Copy
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className='bg-bg-1/50 rounded-xl p-4 mb-6 border border-bg-6/15'>
                <div className='flex items-center justify-center gap-2 mb-2'>
                  <div className='w-2 h-2 rounded-full bg-neon-green animate-pulse' />
                  <span className='font-mono text-xs text-neon-green font-bold'>
                    Room Active
                  </span>
                </div>
                <p className='font-mono text-[11px] text-txt-3'>
                  {isHost
                    ? 'Waiting for players to join... Bots will fill remaining slots.'
                    : 'Waiting for host to start the race...'}
                </p>
                <p className='font-mono text-[11px] text-txt-g mt-1'>
                  Difficulty:{' '}
                  <span className='text-txt-2'>
                    {DIFFICULTIES.find((d) => d.key === difficulty)?.label}
                  </span>{' '}
                  · Words: <span className='text-txt-2'>{wordCount}</span>
                </p>
              </div>

              {/* Players in room */}
              <div className='bg-bg-1/30 rounded-xl p-3 mb-6 border border-bg-6/10'>
                <p className='font-mono text-[10px] text-txt-g uppercase tracking-[1.5px] mb-2'>
                  Players in room ({humanPlayers.length})
                </p>
                <div className='flex flex-wrap justify-center gap-2'>
                  {humanPlayers.length > 0 ? (
                    humanPlayers.map((p) => (
                      <span
                        key={p.id}
                        className='font-mono text-xs font-bold px-3 py-1.5 rounded-lg border'
                        style={{
                          color: p.color,
                          background: p.color + '15',
                          borderColor: p.color + '30',
                        }}
                      >
                        {p.name}{' '}
                        {p.id === useStore.getState().playerId && isHost
                          ? '(Host)'
                          : ''}
                      </span>
                    ))
                  ) : (
                    <span className='font-mono text-xs text-accent font-bold bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20'>
                      {playerName || 'You'} {isHost ? '(Host)' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions — ONLY host gets Start Race */}
              <div className='flex gap-3'>
                <button
                  onClick={backToMenu}
                  className='flex-1 py-3.5 rounded-xl border-[1.5px] border-bg-6/40 bg-bg-3 text-txt-2 text-sm font-bold hover:border-bg-7 hover:text-txt-1 active:scale-[0.98] transition-all'
                >
                  ← Back
                </button>
                {isHost ? (
                  <button
                    onClick={startFromWaiting}
                    className='flex-[2] py-3.5 rounded-xl bg-gradient-to-br from-neon-green/90 to-neon-green text-white text-sm font-bold shadow-[0_4px_20px_rgba(46,204,113,0.25)] hover:-translate-y-px hover:shadow-[0_6px_28px_rgba(46,204,113,0.35)] active:scale-[0.98] transition-all'
                  >
                    🚀 Start Race
                  </button>
                ) : (
                  <div className='flex-[2] py-3.5 rounded-xl border-[1.5px] border-bg-6/20 bg-bg-4/50 text-txt-3 text-sm font-bold flex items-center justify-center gap-2'>
                    <div className='w-2 h-2 rounded-full bg-accent animate-pulse' />
                    Waiting for host to start...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
