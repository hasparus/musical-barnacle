/* eslint-disable @typescript-eslint/no-namespace */
import type { fs } from "@tauri-apps/api";

export interface ApplicationState {
  status?:
    | "initialising"
    | "gathering-missing-files"
    | "reading-configs-contents"
    | "idle";

  workingDirectory?: {
    path: string;
    files: FileEntry[];
  };
  configFileContents: Record<AbsolutePath, ConfigFile>;
  /**
   * messages for the user to handle
   */
  events: AppEvent[];
  uiState: {
    settingsOpen: boolean;
  };
}

type EventOf<TType extends string, TPayload extends object = {}> = {
  type: TType;
  date: Date | string;
} & TPayload;

export namespace AppEvent {
  export type OfType<T extends AppEvent["type"]> = Extract<
    AppEvent,
    { type: T }
  >;
}

export type AppEvent =
  | EventOf<"please-enter-working-directory">
  | EventOf<"error", { message: string }>
  | EventOf<"file-missing", { path: string }>
  | EventOf<"new-file-added", { path: string }>
  | EventOf<
      "file-content-conflict",
      { path: string; oldContent: ConfigFile; newContent: ConfigFile }
    >;

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
  ModulesPortEndIndex?: string;
  ModulesPortStartIndex?: string;
  ProxyIPs: string;
  ProxyWindowsEnable: boolean;
}

export type AbsolutePath = string;

export interface FileEntry extends fs.FileEntry {}
