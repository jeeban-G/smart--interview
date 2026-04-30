import { useHomeState } from '../hooks/useHomeState';
import AgentModal from '../components/AgentModal';
import Header from '../components/home/Header';
import HeroSection from '../components/home/HeroSection';
import PositionSelector from '../components/home/PositionSelector';
import MultiRoomSelector from '../components/home/MultiRoomSelector';
import FeaturesSection from '../components/home/FeaturesSection';
import AgentList from '../components/home/AgentList';
import InterviewHistory from '../components/home/InterviewHistory';

export default function Home() {
  const state = useHomeState();

  const handleDeleteAgent = async (agentId: number) => {
    try {
      await state.deleteAgent(agentId);
    } catch (err) {
      alert('删除失败');
    }
  };

  const handleDeleteInterview = async (interviewId: number) => {
    try {
      await state.deleteInterview(interviewId);
    } catch (err: any) {
      alert(err.message || '删除失败');
    }
  };

  if (state.pageLoading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#09090b',
      }}>
        <div style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#fbbf24',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');

        * {
          box-sizing: border-box;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .gradient-text {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-gradient {
          background: radial-gradient(ellipse at 20% 0%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 20%, rgba(251, 191, 36, 0.1) 0%, transparent 40%),
                      radial-gradient(ellipse at 50% 100%, rgba(34, 197, 94, 0.08) 0%, transparent 50%);
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
      `}</style>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Header
          roomStatus={state.roomStatus}
          userName={state.user?.nickname || state.user?.email || ''}
          onLogout={state.logout}
        />

        <HeroSection
          interviewType={state.interviewType}
          onTypeChange={state.setInterviewType}
        />

        {/* Main Content */}
        <section style={{
          padding: '0 40px 64px',
          maxWidth: 1100,
          margin: '0 auto',
        }}>
          {state.interviewType !== 'multi' && (
            <PositionSelector
              positions={state.positions}
              filteredPositions={state.filteredPositions}
              selectedPosition={state.selectedPosition}
              searchQuery={state.searchQuery}
              activeFilter={state.activeFilter}
              agents={state.agents}
              selectedCandidateAgentId={state.selectedCandidateAgentId}
              selectedInterviewerAgentId={state.selectedInterviewerAgentId}
              loading={state.loading}
              interviewType={state.interviewType}
              onSelectPosition={state.setSelectedPosition}
              onSearchChange={state.setSearchQuery}
              onFilterChange={state.setActiveFilter}
              onCandidateAgentChange={state.setSelectedCandidateAgentId}
              onInterviewerAgentChange={state.setSelectedInterviewerAgentId}
              onCreate={state.handleCreate}
            />
          )}

          {state.interviewType === 'multi' && (
            <MultiRoomSelector
              positions={state.positions}
              filteredPositions={state.filteredPositions}
              multiRoomCount={state.multiRoomCount}
              multiRoomPositions={state.multiRoomPositions}
              roomStatus={state.roomStatus}
              loading={state.loading}
              onRoomCountChange={state.setMultiRoomCount}
              onPositionChange={(index, pos) => {
                const newPositions = [...state.multiRoomPositions];
                newPositions[index] = pos;
                state.setMultiRoomPositions(newPositions.filter(p => p.id));
              }}
              onCreate={state.handleCreate}
            />
          )}
        </section>

        <FeaturesSection />

        <AgentList
          agents={state.agents}
          agentTab={state.agentTab}
          onTabChange={state.setAgentTab}
          onCreateAgent={() => { state.setEditingAgent(undefined); state.setShowAgentModal(true); }}
          onEditAgent={(agent) => { state.setEditingAgent(agent); state.setShowAgentModal(true); }}
          onDeleteAgent={handleDeleteAgent}
        />

        {state.history.length > 0 && (
          <InterviewHistory
            history={state.history}
            roomTab={state.roomTab}
            onTabChange={state.setRoomTab}
            onDelete={handleDeleteInterview}
          />
        )}

        {/* Agent Modal */}
        {state.showAgentModal && (
          <AgentModal
            isOpen={state.showAgentModal}
            onClose={() => state.setShowAgentModal(false)}
            initialType={state.agentTab === 'candidate' ? 'candidate' : 'interviewer'}
            editAgent={state.editingAgent}
            onSuccess={(agent) => {
              if (state.editingAgent) {
                state.setAgents(state.agents.map(a => a.id === agent.id ? agent : a));
              } else {
                state.setAgents([agent, ...state.agents]);
              }
            }}
          />
        )}

        {/* Footer */}
        <footer style={{
          padding: '32px 40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          textAlign: 'center',
          color: '#52525b',
          fontSize: 11,
        }}>
          © 2026 A2A 面试 · 智能模拟面试平台
        </footer>
      </div>
    </div>
  );
}
