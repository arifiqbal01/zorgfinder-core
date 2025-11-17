import { registerBlockType } from "@wordpress/blocks";
import Edit from "./edit";
import save from "./save";
import "./editor.scss";
import "./style.scss";

registerBlockType("zorgfinder/review-form", {
  edit: Edit,
  save,
});
