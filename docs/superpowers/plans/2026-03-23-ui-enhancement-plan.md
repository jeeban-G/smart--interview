# UI Enhancement Implementation Plan

## Context

从与 Pramp、Interviewing.io、CodeInterview 等优秀平台的对比中，识别出三个高优先级的功能缺失：
1. 面试进度条/计时器
2. 评估报告图表（雷达图、分数可视化）
3. 面试回放功能

当前系统使用 React + TypeScript + Vite (前端) 和 Express + TypeScript + SQLite (后端)。

---

## Architecture

### Feature 1: Interview Progress Bar/Timer

**目标**：在面试界面显示进度条和计时器，让用户知道面试进行到哪里了。

**实现方案**：
- 添加一个计时器组件，显示已用时间
- 添加进度指示器（基于消息数量，估算面试进度）
- 进度阈值：5轮以下=简短，10轮以下=中等，10轮+=完整面试

**Files to Modify**:
- `client/src/components/InterviewProgress.tsx` - 新建
- `client/src/pages/Interview.tsx` - 集成进度组件

### Feature 2: Evaluation Report Charts

**目标**：在评估报告中添加雷达图和分数可视化，类似竞品的效果。

**实现方案**：
- 扩展 EnhancedEvaluation 接口中的分数字段
- 创建雷达图组件（RadarChart）
- 创建分数条形图组件（ScoreBar）
- 修改 EvaluationReport.tsx 集成图表

**Files to Modify**:
- `client/src/components/RadarChart.tsx` - 新建
- `client/src/components/ScoreBar.tsx` - 新建
- `client/src/components/EvaluationReport.tsx` - 添加图表
- `client/src/types/index.ts` - 确认 EnhancedEvaluation 类型

### Feature 3: Interview Playback

**目标**：允许用户回放整个面试过程。

**实现方案**：
- 添加一个"回放模式"按钮
- 创建回放组件，按时间顺序显示消息
- 添加播放/暂停/快进控制
- 自动播放消息，模拟真实面试速度

**Files to Modify**:
- `client/src/components/InterviewPlayback.tsx` - 新建
- `client/src/pages/Interview.tsx` - 添加回放按钮和条件渲染

---

## Tasks

### Task 1: Interview Progress Bar/Timer

**Files**:
- Create: `client/src/components/InterviewProgress.tsx`
- Modify: `client/src/pages/Interview.tsx`

- [ ] **Step 1: Create InterviewProgress component**

```tsx
// InterviewProgress.tsx
interface InterviewProgressProps {
  startTime: string;
  messageCount: number;
  isActive: boolean;
}
```

- [ ] **Step 2: Add to Interview.tsx header section**

---

### Task 2: Evaluation Report Charts

**Files**:
- Create: `client/src/components/RadarChart.tsx`
- Create: `client/src/components/ScoreBar.tsx`
- Modify: `client/src/components/EvaluationReport.tsx`

- [ ] **Step 1: Create RadarChart component**

```tsx
interface RadarChartProps {
  scores: {
    technical_depth?: number;
    communication?: number;
    project_experience?: number;
    adaptability?: number;
  };
}
```

- [ ] **Step 2: Create ScoreBar component**

```tsx
interface ScoreBarProps {
  label: string;
  score: number;
  maxScore: number;
  color: string;
}
```

- [ ] **Step 3: Update EvaluationReport to use charts**

---

### Task 3: Interview Playback

**Files**:
- Create: `client/src/components/InterviewPlayback.tsx`
- Modify: `client/src/pages/Interview.tsx`

- [ ] **Step 1: Create InterviewPlayback component**

```tsx
interface InterviewPlaybackProps {
  messages: Message[];
  onClose: () => void;
}
```

- [ ] **Step 2: Add playback button and mode to Interview.tsx**

---

## Verification

1. Run `cd client && npx tsc --noEmit` - TypeScript compiles without errors
2. Start both servers and verify each feature works
3. Test progress bar updates during interview
4. Test evaluation report shows charts when scores available
5. Test playback mode can replay messages
