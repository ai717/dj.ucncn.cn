# Backspin 中文版 · 浏览器互动 DJ 教练 (dj.ucncn.cn)

零门槛、免注册、免设备的浏览器端交互式 DJ 混音教练（MVP v1）。

## 核心特性
- **双黑胶唱机 + 中央混音台**：Web Audio API 实时驱动双轨播放、±8% 调速、等功率 Crossfader、三段 EQ（High / Mid / Bass）与 Filter。
- **4 首零版权内置合成舞曲**：基于 Web Audio 离线/程序化合成（House / Techno / Hip-Hop / Progressive），秒开零版权风险。
- **5 节互动式课程**：每节课支持「演示给我看 (Show me)」虚拟光标自动示范，以及基于状态机的**语义化实时纠错**。
- **零后端持久化**：课程进度保存在 `localStorage`（`ucncn_dj_progress_v1`）。

## 架构归属
本项目为 `ucncn` 仓库**模式 A** 独立二级域名项目（已在主站 `.gitignore` 排除），拥有独立 Git 仓库与发布配置。
