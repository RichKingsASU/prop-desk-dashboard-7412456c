export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      broker_accounts: {
        Row: {
          account_label: string
          api_credential_ref: string | null
          api_key_alias: string | null
          broker_account_id: string
          broker_name: Database["public"]["Enums"]["broker_name"]
          created_at: string
          id: string
          is_paper_trading: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label: string
          api_credential_ref?: string | null
          api_key_alias?: string | null
          broker_account_id: string
          broker_name: Database["public"]["Enums"]["broker_name"]
          created_at?: string
          id?: string
          is_paper_trading?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_label?: string
          api_credential_ref?: string | null
          api_key_alias?: string | null
          broker_account_id?: string
          broker_name?: Database["public"]["Enums"]["broker_name"]
          created_at?: string
          id?: string
          is_paper_trading?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broker_balances: {
        Row: {
          broker_account_id: string
          buying_power: number | null
          cash: number | null
          equity: number | null
          id: string
          maintenance_margin: number | null
          raw: Json | null
          updated_at: string
        }
        Insert: {
          broker_account_id: string
          buying_power?: number | null
          cash?: number | null
          equity?: number | null
          id?: string
          maintenance_margin?: number | null
          raw?: Json | null
          updated_at: string
        }
        Update: {
          broker_account_id?: string
          buying_power?: number | null
          cash?: number | null
          equity?: number | null
          id?: string
          maintenance_margin?: number | null
          raw?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_balances_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: true
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_positions: {
        Row: {
          avg_price: number | null
          broker_account_id: string
          id: string
          market_value: number | null
          qty: number
          raw: Json | null
          symbol: string
          updated_at: string
        }
        Insert: {
          avg_price?: number | null
          broker_account_id: string
          id?: string
          market_value?: number | null
          qty: number
          raw?: Json | null
          symbol: string
          updated_at: string
        }
        Update: {
          avg_price?: number | null
          broker_account_id?: string
          id?: string
          market_value?: number | null
          qty?: number
          raw?: Json | null
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broker_positions_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_tokens: {
        Row: {
          access_token: string
          account_id: string | null
          broker: string
          expires_at: string | null
          id: string
          metadata: Json
          refreshed_at: string
          token_type: string
        }
        Insert: {
          access_token: string
          account_id?: string | null
          broker: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          refreshed_at?: string
          token_type: string
        }
        Update: {
          access_token?: string
          account_id?: string | null
          broker?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          refreshed_at?: string
          token_type?: string
        }
        Relationships: []
      }
      daily_pnl_reports: {
        Row: {
          breakdown: Json | null
          broker_account_id: string
          created_at: string
          ending_cash: number | null
          id: string
          realized_pnl: number
          report_date: string
          starting_cash: number | null
          total_pnl: number
          unrealized_pnl_eod: number
          user_id: string
        }
        Insert: {
          breakdown?: Json | null
          broker_account_id: string
          created_at?: string
          ending_cash?: number | null
          id?: string
          realized_pnl?: number
          report_date: string
          starting_cash?: number | null
          total_pnl?: number
          unrealized_pnl_eod?: number
          user_id: string
        }
        Update: {
          breakdown?: Json | null
          broker_account_id?: string
          created_at?: string
          ending_cash?: number | null
          id?: string
          realized_pnl?: number
          report_date?: string
          starting_cash?: number | null
          total_pnl?: number
          unrealized_pnl_eod?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_pnl_reports_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_quotes: {
        Row: {
          ask_price: number | null
          ask_size: number | null
          bid_price: number | null
          bid_size: number | null
          last_trade_price: number | null
          last_trade_size: number | null
          last_update_ts: string
          symbol: string
        }
        Insert: {
          ask_price?: number | null
          ask_size?: number | null
          bid_price?: number | null
          bid_size?: number | null
          last_trade_price?: number | null
          last_trade_size?: number | null
          last_update_ts?: string
          symbol: string
        }
        Update: {
          ask_price?: number | null
          ask_size?: number | null
          bid_price?: number | null
          bid_size?: number | null
          last_trade_price?: number | null
          last_trade_size?: number | null
          last_update_ts?: string
          symbol?: string
        }
        Relationships: []
      }
      market_data_1m: {
        Row: {
          close: number
          high: number
          low: number
          open: number
          symbol: string
          ts: string
          volume: number
        }
        Insert: {
          close: number
          high: number
          low: number
          open: number
          symbol: string
          ts: string
          volume: number
        }
        Update: {
          close?: number
          high?: number
          low?: number
          open?: number
          symbol?: string
          ts?: string
          volume?: number
        }
        Relationships: []
      }
      news_events: {
        Row: {
          body: string | null
          category: string | null
          event_ts: string | null
          headline: string
          id: string
          importance: number | null
          raw: Json | null
          received_at: string
          sentiment: string | null
          source: string
          symbol: string | null
          url: string | null
        }
        Insert: {
          body?: string | null
          category?: string | null
          event_ts?: string | null
          headline: string
          id?: string
          importance?: number | null
          raw?: Json | null
          received_at?: string
          sentiment?: string | null
          source: string
          symbol?: string | null
          url?: string | null
        }
        Update: {
          body?: string | null
          category?: string | null
          event_ts?: string | null
          headline?: string
          id?: string
          importance?: number | null
          raw?: Json | null
          received_at?: string
          sentiment?: string | null
          source?: string
          symbol?: string | null
          url?: string | null
        }
        Relationships: []
      }
      option_contracts: {
        Row: {
          created_at: string
          expiration_date: string
          id: string
          last_seen_at: string
          multiplier: number
          option_type: string
          source: string
          strike_price: number
          symbol: string
          underlying_symbol: string
        }
        Insert: {
          created_at?: string
          expiration_date: string
          id?: string
          last_seen_at?: string
          multiplier?: number
          option_type: string
          source?: string
          strike_price: number
          symbol: string
          underlying_symbol: string
        }
        Update: {
          created_at?: string
          expiration_date?: string
          id?: string
          last_seen_at?: string
          multiplier?: number
          option_type?: string
          source?: string
          strike_price?: number
          symbol?: string
          underlying_symbol?: string
        }
        Relationships: []
      }
      options_flow: {
        Row: {
          ask: number | null
          bid: number | null
          event_ts: string
          expiration: string | null
          id: string
          notional: number | null
          option_symbol: string
          option_type: string | null
          raw: Json | null
          received_at: string
          side: string
          size: number
          source: string
          strike: number | null
          symbol: string
          trade_price: number | null
          venue: string | null
        }
        Insert: {
          ask?: number | null
          bid?: number | null
          event_ts: string
          expiration?: string | null
          id?: string
          notional?: number | null
          option_symbol: string
          option_type?: string | null
          raw?: Json | null
          received_at?: string
          side: string
          size: number
          source?: string
          strike?: number | null
          symbol: string
          trade_price?: number | null
          venue?: string | null
        }
        Update: {
          ask?: number | null
          bid?: number | null
          event_ts?: string
          expiration?: string | null
          id?: string
          notional?: number | null
          option_symbol?: string
          option_type?: string | null
          raw?: Json | null
          received_at?: string
          side?: string
          size?: number
          source?: string
          strike?: number | null
          symbol?: string
          trade_price?: number | null
          venue?: string | null
        }
        Relationships: []
      }
      paper_orders: {
        Row: {
          broker_account_id: string
          created_at: string
          id: string
          instrument_type: string
          notional: number
          order_type: string
          quantity: number | null
          raw_order: Json
          risk_allowed: boolean
          risk_reason: string | null
          risk_scope: string | null
          side: string
          status: string
          strategy_id: string
          symbol: string
          time_in_force: string
          user_id: string
        }
        Insert: {
          broker_account_id: string
          created_at?: string
          id?: string
          instrument_type: string
          notional: number
          order_type: string
          quantity?: number | null
          raw_order: Json
          risk_allowed?: boolean
          risk_reason?: string | null
          risk_scope?: string | null
          side: string
          status?: string
          strategy_id: string
          symbol: string
          time_in_force?: string
          user_id: string
        }
        Update: {
          broker_account_id?: string
          created_at?: string
          id?: string
          instrument_type?: string
          notional?: number
          order_type?: string
          quantity?: number | null
          raw_order?: Json
          risk_allowed?: boolean
          risk_reason?: string | null
          risk_scope?: string | null
          side?: string
          status?: string
          strategy_id?: string
          symbol?: string
          time_in_force?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_paper_orders_broker_accounts"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_paper_orders_strategies"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_trades: {
        Row: {
          alpaca_order_id: string | null
          created_at: string
          id: string
          price: number
          qty: number
          side: string
          source: string | null
          status: string | null
          symbol: string
        }
        Insert: {
          alpaca_order_id?: string | null
          created_at?: string
          id?: string
          price: number
          qty: number
          side: string
          source?: string | null
          status?: string | null
          symbol: string
        }
        Update: {
          alpaca_order_id?: string | null
          created_at?: string
          id?: string
          price?: number
          qty?: number
          side?: string
          source?: string | null
          status?: string | null
          symbol?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          avg_entry_price: number
          broker_account_id: string
          created_at: string
          current_market_value: number | null
          current_price: number | null
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          last_updated_at: string
          option_contract_id: string | null
          quantity: number
          realized_pnl: number | null
          symbol: string
          unrealized_pnl: number | null
          user_id: string
        }
        Insert: {
          avg_entry_price: number
          broker_account_id: string
          created_at?: string
          current_market_value?: number | null
          current_price?: number | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          last_updated_at?: string
          option_contract_id?: string | null
          quantity: number
          realized_pnl?: number | null
          symbol: string
          unrealized_pnl?: number | null
          user_id: string
        }
        Update: {
          avg_entry_price?: number
          broker_account_id?: string
          created_at?: string
          current_market_value?: number | null
          current_price?: number | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          last_updated_at?: string
          option_contract_id?: string | null
          quantity?: number
          realized_pnl?: number | null
          symbol?: string
          unrealized_pnl?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_option_contract_id_fkey"
            columns: ["option_contract_id"]
            isOneToOne: false
            referencedRelation: "option_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_limits: {
        Row: {
          broker_account_id: string | null
          created_at: string
          enabled: boolean
          id: string
          max_drawdown_per_day: number | null
          max_loss_per_day: number | null
          max_loss_per_trade: number | null
          max_notional_per_symbol: number | null
          max_notional_per_trade: number | null
          max_notional_total: number | null
          max_open_positions: number | null
          max_trades_per_day: number | null
          scope: Database["public"]["Enums"]["risk_scope"]
          strategy_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_account_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          max_drawdown_per_day?: number | null
          max_loss_per_day?: number | null
          max_loss_per_trade?: number | null
          max_notional_per_symbol?: number | null
          max_notional_per_trade?: number | null
          max_notional_total?: number | null
          max_open_positions?: number | null
          max_trades_per_day?: number | null
          scope?: Database["public"]["Enums"]["risk_scope"]
          strategy_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_account_id?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          max_drawdown_per_day?: number | null
          max_loss_per_day?: number | null
          max_loss_per_trade?: number | null
          max_notional_per_symbol?: number | null
          max_notional_per_trade?: number | null
          max_notional_total?: number | null
          max_open_positions?: number | null
          max_trades_per_day?: number | null
          scope?: Database["public"]["Enums"]["risk_scope"]
          strategy_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_limits_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_limits_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategies: {
        Row: {
          broker_account_id: string | null
          config: Json
          created_at: string
          description: string | null
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          name: string
          status: Database["public"]["Enums"]["strategy_status"]
          target_symbols: string[]
          trading_session: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_account_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          name: string
          status?: Database["public"]["Enums"]["strategy_status"]
          target_symbols?: string[]
          trading_session?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_account_id?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          name?: string
          status?: Database["public"]["Enums"]["strategy_status"]
          target_symbols?: string[]
          trading_session?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategies_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      strategy_limits: {
        Row: {
          cool_down_minutes: number | null
          created_at: string | null
          id: string
          max_daily_trades: number | null
          max_notional_per_day: number | null
          max_notional_per_trade: number | null
          max_open_positions: number | null
          max_position_size: number | null
          strategy_id: string | null
        }
        Insert: {
          cool_down_minutes?: number | null
          created_at?: string | null
          id?: string
          max_daily_trades?: number | null
          max_notional_per_day?: number | null
          max_notional_per_trade?: number | null
          max_open_positions?: number | null
          max_position_size?: number | null
          strategy_id?: string | null
        }
        Update: {
          cool_down_minutes?: number | null
          created_at?: string | null
          id?: string
          max_daily_trades?: number | null
          max_notional_per_day?: number | null
          max_notional_per_trade?: number | null
          max_open_positions?: number | null
          max_position_size?: number | null
          strategy_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_limits_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_logs: {
        Row: {
          created_at: string | null
          decision: string | null
          did_trade: boolean | null
          id: string
          paper_trade_id: string | null
          reason: string | null
          signal_payload: Json | null
          strategy_id: string | null
          symbol: string | null
        }
        Insert: {
          created_at?: string | null
          decision?: string | null
          did_trade?: boolean | null
          id?: string
          paper_trade_id?: string | null
          reason?: string | null
          signal_payload?: Json | null
          strategy_id?: string | null
          symbol?: string | null
        }
        Update: {
          created_at?: string | null
          decision?: string | null
          did_trade?: boolean | null
          id?: string
          paper_trade_id?: string | null
          reason?: string | null
          signal_payload?: Json | null
          strategy_id?: string | null
          symbol?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_logs_paper_trade_id_fkey"
            columns: ["paper_trade_id"]
            isOneToOne: false
            referencedRelation: "paper_trades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_logs_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_runs: {
        Row: {
          broker_account_id: string
          created_at: string
          ended_at: string | null
          gross_pnl: number | null
          id: string
          max_drawdown: number | null
          max_intraday_exposure: number | null
          net_pnl: number | null
          notes: string | null
          run_date: string
          started_at: string
          status: string
          strategy_id: string
          trades_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          broker_account_id: string
          created_at?: string
          ended_at?: string | null
          gross_pnl?: number | null
          id?: string
          max_drawdown?: number | null
          max_intraday_exposure?: number | null
          net_pnl?: number | null
          notes?: string | null
          run_date: string
          started_at: string
          status?: string
          strategy_id: string
          trades_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          broker_account_id?: string
          created_at?: string
          ended_at?: string | null
          gross_pnl?: number | null
          id?: string
          max_drawdown?: number | null
          max_intraday_exposure?: number | null
          net_pnl?: number | null
          notes?: string | null
          run_date?: string
          started_at?: string
          status?: string
          strategy_id?: string
          trades_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategy_runs_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "strategy_runs_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategy_state: {
        Row: {
          created_at: string | null
          id: string
          last_signal_at: string | null
          last_trade_at: string | null
          notional_traded: number
          strategy_id: string | null
          trades_placed: number
          trading_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_signal_at?: string | null
          last_trade_at?: string | null
          notional_traded?: number
          strategy_id?: string | null
          trades_placed?: number
          trading_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_signal_at?: string | null
          last_trade_at?: string | null
          notional_traded?: number
          strategy_id?: string | null
          trades_placed?: number
          trading_date?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_state_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategy_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          average_fill_price: number | null
          broker_account_id: string
          broker_execution_id: string | null
          broker_order_id: string | null
          canceled_at: string | null
          created_at: string
          error_message: string | null
          fees: number | null
          filled_at: string | null
          filled_qty: number | null
          id: string
          instrument: Database["public"]["Enums"]["instrument_type"]
          option_contract_id: string | null
          order_type: Database["public"]["Enums"]["order_type"]
          raw_broker_request: Json | null
          raw_broker_response: Json | null
          requested_price: number | null
          requested_qty: number
          side: Database["public"]["Enums"]["trade_side"]
          status: Database["public"]["Enums"]["trade_status"]
          strategy_id: string | null
          submitted_at: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          average_fill_price?: number | null
          broker_account_id: string
          broker_execution_id?: string | null
          broker_order_id?: string | null
          canceled_at?: string | null
          created_at?: string
          error_message?: string | null
          fees?: number | null
          filled_at?: string | null
          filled_qty?: number | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          option_contract_id?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          raw_broker_request?: Json | null
          raw_broker_response?: Json | null
          requested_price?: number | null
          requested_qty: number
          side: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["trade_status"]
          strategy_id?: string | null
          submitted_at?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          average_fill_price?: number | null
          broker_account_id?: string
          broker_execution_id?: string | null
          broker_order_id?: string | null
          canceled_at?: string | null
          created_at?: string
          error_message?: string | null
          fees?: number | null
          filled_at?: string | null
          filled_qty?: number | null
          id?: string
          instrument?: Database["public"]["Enums"]["instrument_type"]
          option_contract_id?: string | null
          order_type?: Database["public"]["Enums"]["order_type"]
          raw_broker_request?: Json | null
          raw_broker_response?: Json | null
          requested_price?: number | null
          requested_qty?: number
          side?: Database["public"]["Enums"]["trade_side"]
          status?: Database["public"]["Enums"]["trade_status"]
          strategy_id?: string | null
          submitted_at?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_broker_account_id_fkey"
            columns: ["broker_account_id"]
            isOneToOne: false
            referencedRelation: "broker_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_option_contract_id_fkey"
            columns: ["option_contract_id"]
            isOneToOne: false
            referencedRelation: "option_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "strategies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      broker_name: "tastytrade" | "alpaca"
      instrument_type: "equity" | "option"
      order_type: "market" | "limit" | "stop" | "stop_limit"
      risk_scope: "account" | "strategy"
      strategy_status: "active" | "inactive" | "draft"
      trade_side: "buy" | "sell"
      trade_status: "pending" | "filled" | "canceled" | "rejected" | "error"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      broker_name: ["tastytrade", "alpaca"],
      instrument_type: ["equity", "option"],
      order_type: ["market", "limit", "stop", "stop_limit"],
      risk_scope: ["account", "strategy"],
      strategy_status: ["active", "inactive", "draft"],
      trade_side: ["buy", "sell"],
      trade_status: ["pending", "filled", "canceled", "rejected", "error"],
    },
  },
} as const
