/* eslint-disable @typescript-eslint/no-namespace */
import type { fs } from "@tauri-apps/api";

export interface ApplicationState {
  workingDirectory?: {
    path: string;
    files: FileEntry[];
  };
  configFileContents: Record<AbsolutePath, ConfigFile>;
  /**
   * messages for the user to handle
   */
  notifications: Notification[];
}

type Notification =
  | {
      type: "working-directory-diverged-from-app-state";
    }
  | {
      type: "please-enter-working-directory";
    };

export namespace ConfigFile {
  export namespace IpFilteringOption {
    export const NoFiltering = 0;
    export type NoFiltering = typeof NoFiltering;
    export const AllowList = 1;
    export type AllowList = typeof AllowList;
    export const BlockList = 2;
    export type BlockList = typeof BlockList;
  }
  export interface IpFilteringOption {
    IpFilteringOption:
      | IpFilteringOption.NoFiltering
      | IpFilteringOption.AllowList
      | IpFilteringOption.BlockList;

    /**
     * IP addresses separated with semicolons (;) with ranges declared with (-)
     */
    SetOfIpAddresses: string;
  }
}

export interface ConfigFile extends ConfigFile.IpFilteringOption {
  ConnectionString: string;
  ApplicationUrl: string;
  ApplicationName: string;
  HostAsStandalone: false;
}

export type AbsolutePath = string;

export interface FileEntry extends fs.FileEntry {}
