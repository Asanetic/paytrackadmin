import DynamicModalProvider from "./DynamicModalProvider";

import {FloatingUpgradeButton} from '../mosybilling/PremuimBtn';
import BuilderMutations, { BuilderButton } from "../builderUtils/builder";
import mosyThemeConfigs from "../appConfigs/mosyTheme";

export default function AdminFooter() {
  return (
    <>
      {/* DOM targets */}
      <div id="snack_box"></div>
      <div id="ajax_snack_id"></div>
      <div id="dialog_box"></div>
      <div id="ajax_snack"></div>
      <div id="alert_box"></div>
      <div id="magic_alert"></div>
      <DynamicModalProvider />
      
      <script type="text/javascript" src={`https://portals.asanetic.com/ma/maira.js?coraasset=${mosyThemeConfigs.mosyAppName}`}></script>

      {/* <FloatingUpgradeButton/> */}
      {/* <script type="text/javascript" src="https://cora.asanetic.com/cora.js?coraasset=Symphony gps"></script>
      <BuilderButton/> */}
    </>
  );
}
