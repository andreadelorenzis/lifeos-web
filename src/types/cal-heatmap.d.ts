// src/types/cal-heatmap.d.ts
declare module 'cal-heatmap' {
    import CalHeatmap from 'cal-heatmap/src/index';
    export default CalHeatmap;
}

declare module 'cal-heatmap/plugins/Tooltip' {
    import type { CalHeatmap } from 'cal-heatmap/src/index';
    const Tooltip: CalHeatmap.IPluginContructor;
    export default Tooltip;
}