import React, { useState, useEffect, useMemo, useRef } from 'react';
import USAMap from 'react-usa-map';
import confetti from 'canvas-confetti';
import { US_STATES, COLORS } from './constants';
import { StateData, Region, GameMode, MapCustomization } from './types';
import ProgressBar from './components/ProgressBar';
import Confetti from './components/Confetti';
import Modal from './components/Modal';

const App: React.FC = () => {
  // Game State
  const [mode, setMode] = useState<GameMode>(GameMode.FLASHCARD);
  const [region, setRegion] = useState<Region>(Region.ALL);
  const [completedStates, setCompletedStates] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<StateData | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // UI State
  const [mapCustomization, setMapCustomization] = useState<MapCustomization>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; body: React.ReactNode; type: 'info' | 'success' | 'error' }>({ title: '', body: null, type: 'info' });
  const [hint, setHint] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // For Capital Quiz input
  const [capitalInput, setCapitalInput] = useState('');
  
  // Map Reference for manipulating DOM (removing tooltips)
  const mapRef = useRef<HTMLDivElement>(null);

  // Filter states based on region
  const filteredStates = useMemo(() => {
    return region === Region.ALL
      ? US_STATES
      : US_STATES.filter((s) => s.region === region);
  }, [region]);

  // Timer Logic
  useEffect(() => {
    let interval: any;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (!isTimerRunning && timer !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Remove Tooltips Effect
  useEffect(() => {
    if (mapRef.current) {
      // Remove <title> elements from the SVG to prevent browser tooltips revealing answers
      const titles = mapRef.current.querySelectorAll('title');
      titles.forEach(title => title.remove());
    }
  }, [mapCustomization, region, mode, currentQuestion]);

  // Reset Logic
  const resetGame = (newMode: GameMode) => {
    setMode(newMode);
    setCompletedStates([]);
    setStreak(0);
    setScore(0);
    setTimer(0);
    setIsTimerRunning(newMode !== GameMode.FLASHCARD);
    setMapCustomization({});
    setHint(null);
    setCapitalInput('');
    setShowConfetti(false);
    pickNextQuestion(newMode, [], region);
  };

  const pickNextQuestion = (
    currentMode: GameMode, 
    completed: string[], 
    currentRegion: Region
  ) => {
    // Re-calculate filtered list to ensure we have fresh data
    const applicableStates = currentRegion === Region.ALL 
      ? US_STATES 
      : US_STATES.filter(s => s.region === currentRegion);
      
    const available = applicableStates.filter((s) => !completed.includes(s.abbr));

    if (available.length === 0) {
      setCurrentQuestion(null);
      setIsTimerRunning(false);
      setShowConfetti(true);
      setModalContent({
        title: "YOU DID IT!",
        body: <div className="text-lg">You mastered all the states! Amazing job! <br/> Final Time: {formatTime(timer)}</div>,
        type: 'success'
      });
      setModalOpen(true);
      return;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const nextState = available[randomIndex];
    setCurrentQuestion(nextState);
    setHint(null);
    setCapitalInput('');
  };

  // Helper: Format Seconds
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Map Click Handler
  const mapHandler = (event: any) => {
    const stateAbbr = event.target.dataset.name;
    const clickedState = US_STATES.find((s) => s.abbr === stateAbbr);

    if (!clickedState) return;

    if (mode === GameMode.FLASHCARD) {
      setModalContent({
        title: clickedState.name,
        body: (
          <div className="flex flex-col items-center">
             <p className="text-4xl mb-2">🏛️</p>
             <p className="text-xl font-bold text-patriotic-blue">Capital: {clickedState.capital}</p>
             <p className="text-gray-500 mt-2">Region: {clickedState.region}</p>
             <div className="mt-4 p-2 bg-yellow-50 rounded-lg text-sm text-yellow-800" dangerouslySetInnerHTML={{ __html: clickedState.hint }}></div>
          </div>
        ),
        type: 'info'
      });
      setModalOpen(true);
    } else if (mode === GameMode.FIND_STATE) {
      if (!currentQuestion) return;
      
      if (stateAbbr === currentQuestion.abbr) {
        handleCorrectAnswer(stateAbbr);
      } else {
        handleIncorrectAnswer(stateAbbr);
      }
    } else if (mode === GameMode.STATE_MATCH) {
      // In State Match mode, the current question is the active "card" to match
      if (!currentQuestion) return;

      if (stateAbbr === currentQuestion.abbr) {
        handleCorrectAnswer(stateAbbr);
      } else {
        handleIncorrectAnswer(stateAbbr);
      }
    }
  };

  const handleCorrectAnswer = (stateAbbr: string) => {
    // Confetti burst for single correct answer
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    const newCompleted = [...completedStates, stateAbbr];
    setCompletedStates(newCompleted);
    setScore(s => s + 10 + (streak * 2));
    setStreak(s => s + 1);

    // Update map to show green
    setMapCustomization(prev => ({
      ...prev,
      [stateAbbr]: { fill: COLORS.correct }
    }));

    // Next question
    setTimeout(() => {
       pickNextQuestion(mode, newCompleted, region);
    }, 800);
  };

  const handleIncorrectAnswer = async (stateAbbr: string | null) => {
    setStreak(0);
    if (stateAbbr) {
        setMapCustomization(prev => ({
            ...prev,
            [stateAbbr]: { fill: COLORS.incorrect }
        }));
        // Reset color after brief flash
        setTimeout(() => {
            setMapCustomization(prev => {
                const newState = { ...prev };
                delete newState[stateAbbr];
                return newState;
            });
        }, 800);
    }

    // Trigger hint opportunity (automatically fetch hint logic if desired, or let user click button)
  };

  const submitCapital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion) return;

    if (capitalInput.toLowerCase().trim() === currentQuestion.capital.toLowerCase()) {
      handleCorrectAnswer(currentQuestion.abbr);
    } else {
      handleIncorrectAnswer(null); // No map interaction for capital quiz error
      alert("Try again! Use the hint if you need help.");
    }
  };

  const fetchHint = () => {
    if (!currentQuestion) return;
    setHint(currentQuestion.hint);
  };

  // Build customization object for the map
  const getMapConfig = () => {
    const config: MapCustomization = { ...mapCustomization };
    // Ensure completed states stay green
    completedStates.forEach(abbr => {
      config[abbr] = { fill: COLORS.correct };
    });
    return config;
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 bg-pattern">
      <Confetti trigger={showConfetti} />
      
      {/* Header */}
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-3xl shadow-lg border-b-4 border-patriotic-red">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="text-4xl">🇺🇸</div>
            <div>
                <h1 className="text-3xl font-extrabold text-patriotic-blue tracking-tight">Star-Spangled States</h1>
                <p className="text-sm text-gray-500 font-bold">Learn the USA the Fun Way!</p>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="bg-blue-100 px-4 py-2 rounded-xl">
                <span className="text-patriotic-blue font-bold text-sm block">SCORE</span>
                <span className="text-2xl font-black text-patriotic-blue">{score}</span>
            </div>
            <div className="bg-red-100 px-4 py-2 rounded-xl">
                <span className="text-patriotic-red font-bold text-sm block">STREAK</span>
                <span className="text-2xl font-black text-patriotic-red">🔥 {streak}</span>
            </div>
             <div className="bg-yellow-100 px-4 py-2 rounded-xl w-24 text-center">
                <span className="text-yellow-700 font-bold text-sm block">TIME</span>
                <span className="text-xl font-black text-yellow-700">{formatTime(timer)}</span>
            </div>
        </div>
      </header>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 flex flex-col gap-4">
             {/* Mode Selector */}
            <div className="bg-white p-4 rounded-2xl shadow-md">
                <h3 className="font-bold text-gray-700 mb-2">Game Mode</h3>
                <div className="flex flex-col gap-2">
                    {Object.values(GameMode).map((m) => (
                        <button
                            key={m}
                            onClick={() => resetGame(m)}
                            className={`px-4 py-2 rounded-xl text-left font-bold transition-all ${
                                mode === m 
                                ? 'bg-patriotic-blue text-white shadow-lg scale-105' 
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Region Selector */}
            <div className="bg-white p-4 rounded-2xl shadow-md">
                <h3 className="font-bold text-gray-700 mb-2">Region</h3>
                 <select 
                    value={region}
                    onChange={(e) => {
                        setRegion(e.target.value as Region);
                        // Optional: Reset game when region changes to avoid confusion
                        // We will trigger a refresh in the next effect if needed, but manual reset is safer UX
                    }}
                    className="w-full p-2 border-2 border-gray-200 rounded-xl font-bold text-gray-600 focus:border-patriotic-blue outline-none"
                >
                    {Object.values(Region).map((r) => (
                        <option key={r} value={r}>{r}</option>
                    ))}
                </select>
                <button 
                    onClick={() => resetGame(mode)}
                    className="mt-4 w-full bg-patriotic-red text-white font-bold py-2 rounded-xl hover:bg-red-600 transition shadow-md"
                >
                    Restart Game 🔄
                </button>
            </div>
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-3">
             {/* Active Game Question Banner */}
            {mode !== GameMode.FLASHCARD && currentQuestion && (
                <div className="bg-white p-6 rounded-3xl shadow-xl mb-6 border-2 border-patriotic-blue flex flex-col md:flex-row justify-between items-center animate-fade-in-down">
                    <div className="mb-4 md:mb-0">
                        <h2 className="text-gray-500 font-bold uppercase text-sm tracking-wider mb-1">Current Mission</h2>
                        
                        {mode === GameMode.FIND_STATE && (
                            <div className="text-3xl font-black text-patriotic-blue">
                                Where is <span className="text-patriotic-red">{currentQuestion.name}</span>?
                            </div>
                        )}
                        
                        {mode === GameMode.CAPITAL_QUIZ && (
                            <div className="text-2xl font-black text-patriotic-blue">
                                What is the capital of <span className="text-patriotic-red">{currentQuestion.name}</span>?
                            </div>
                        )}

                        {mode === GameMode.STATE_MATCH && (
                            <div className="text-xl font-black text-patriotic-blue">
                                Click the state on the map!
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                        {/* Hint System */}
                        <button 
                            onClick={fetchHint}
                            disabled={hint !== null}
                            className="text-sm bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold px-4 py-2 rounded-full shadow-sm transition flex items-center gap-2 disabled:opacity-50"
                        >
                            {'💡 Need a Hint?'}
                        </button>
                        {hint && (
                            <div 
                                className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-sm text-yellow-800 max-w-xs mt-2 animate-bounce-in"
                                dangerouslySetInnerHTML={{ __html: hint }}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Mode Specific Inputs */}
            {mode === GameMode.CAPITAL_QUIZ && currentQuestion && (
                 <form onSubmit={submitCapital} className="mb-6 flex gap-2">
                    <input 
                        type="text" 
                        value={capitalInput}
                        onChange={(e) => setCapitalInput(e.target.value)}
                        placeholder="Type capital city..."
                        className="flex-1 p-4 rounded-xl border-2 border-gray-300 focus:border-patriotic-blue outline-none text-xl font-bold shadow-inner"
                        autoFocus
                    />
                    <button type="submit" className="bg-patriotic-blue text-white font-bold px-8 rounded-xl shadow-lg hover:bg-blue-700 transition">
                        Submit
                    </button>
                 </form>
            )}

            {mode === GameMode.STATE_MATCH && (
                 <div className="mb-6 bg-white p-4 rounded-2xl shadow-md overflow-x-auto">
                     <div className="flex gap-2 justify-center">
                        <div 
                            className="p-4 rounded-xl border-4 border-patriotic-blue bg-blue-50 transition-all transform hover:scale-105 shadow-md"
                        >
                            <span className="font-black text-2xl text-patriotic-blue">{currentQuestion?.name}</span>
                        </div>
                     </div>
                 </div>
            )}

            {/* Map Container */}
            <div ref={mapRef} className="bg-white p-2 md:p-6 rounded-3xl shadow-2xl relative overflow-hidden border-4 border-white">
                <div className="absolute top-0 right-0 p-4 z-10 opacity-10 pointer-events-none">
                    <span className="text-9xl">🦅</span>
                </div>
                <USAMap 
                    customize={getMapConfig()} 
                    onClick={mapHandler}
                    width="100%"
                />
            </div>
            
            <ProgressBar current={completedStates.length} total={filteredStates.length} />
        </div>
      </div>

      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalContent.title}
        type={modalContent.type}
      >
          {modalContent.body}
      </Modal>

      <div className="mt-8 text-center text-gray-400 font-bold text-xs uppercase tracking-widest">
        Made for Future Patriots
      </div>
    </div>
  );
};

export default App;