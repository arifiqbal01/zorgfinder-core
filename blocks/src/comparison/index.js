import edit from './edit';
import './style.scss';
import './editor.scss';

wp.blocks.registerBlockType('zorg/comparison', {
  apiVersion: 2,
  title: 'Zorg — Comparison Table',
  icon: 'table-col-after',
  category: 'widgets',
  edit,
  save: () => null // server-rendered or frontend-only UI
});
