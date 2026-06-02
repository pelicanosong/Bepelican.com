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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      artesania_variantes: {
        Row: {
          artesania_id: string
          atributos: Json
          created_at: string
          id: string
          precio: number
          stock: number | null
          variante_nombre: string
        }
        Insert: {
          artesania_id: string
          atributos?: Json
          created_at?: string
          id?: string
          precio: number
          stock?: number | null
          variante_nombre: string
        }
        Update: {
          artesania_id?: string
          atributos?: Json
          created_at?: string
          id?: string
          precio?: number
          stock?: number | null
          variante_nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "artesania_variantes_artesania_id_fkey"
            columns: ["artesania_id"]
            isOneToOne: false
            referencedRelation: "artesanias"
            referencedColumns: ["id"]
          },
        ]
      }
      artesanias: {
        Row: {
          categoria: Database["public"]["Enums"]["artesania_categoria"]
          comunidad: string | null
          created_at: string
          cuidados: string | null
          descripcion_corta: string
          descripcion_larga: string
          dimensiones: string | null
          estado: Database["public"]["Enums"]["artesania_estado"]
          galeria: string[] | null
          historia: string
          id: string
          imagen_principal: string | null
          impacto_descripcion: string
          material: string
          moneda: string
          nombre: string
          precio_desde: number
          significado: string | null
          slug: string
          tiempo_elaboracion: string
          tiempo_entrega: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria: Database["public"]["Enums"]["artesania_categoria"]
          comunidad?: string | null
          created_at?: string
          cuidados?: string | null
          descripcion_corta: string
          descripcion_larga: string
          dimensiones?: string | null
          estado?: Database["public"]["Enums"]["artesania_estado"]
          galeria?: string[] | null
          historia: string
          id?: string
          imagen_principal?: string | null
          impacto_descripcion: string
          material: string
          moneda?: string
          nombre: string
          precio_desde: number
          significado?: string | null
          slug: string
          tiempo_elaboracion: string
          tiempo_entrega: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: Database["public"]["Enums"]["artesania_categoria"]
          comunidad?: string | null
          created_at?: string
          cuidados?: string | null
          descripcion_corta?: string
          descripcion_larga?: string
          dimensiones?: string | null
          estado?: Database["public"]["Enums"]["artesania_estado"]
          galeria?: string[] | null
          historia?: string
          id?: string
          imagen_principal?: string | null
          impacto_descripcion?: string
          material?: string
          moneda?: string
          nombre?: string
          precio_desde?: number
          significado?: string | null
          slug?: string
          tiempo_elaboracion?: string
          tiempo_entrega?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: Database["public"]["Enums"]["blog_category"]
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          gallery_images: string[] | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["blog_category"]
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_images?: string[] | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: Database["public"]["Enums"]["blog_category"]
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          gallery_images?: string[] | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories_experience: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      experience_blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          experience_id: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          experience_id: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          experience_id?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_blocked_dates_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_bookings: {
        Row: {
          booking_date: string
          created_at: string | null
          experience_id: string
          id: string
          order_item_id: string
          participants: number
          status: string
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          created_at?: string | null
          experience_id: string
          id?: string
          order_item_id: string
          participants: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          created_at?: string | null
          experience_id?: string
          id?: string
          order_item_id?: string
          participants?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_bookings_experience_fk"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_bookings_order_item_fk"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_categories: {
        Row: {
          category_id: string
          created_at: string | null
          experience_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          experience_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          experience_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories_experience"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_categories_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_lodgings: {
        Row: {
          created_at: string
          experience_id: string
          id: string
          is_active: boolean
          is_default_option: boolean
          lodging_id: string
          room_type_id: string | null
        }
        Insert: {
          created_at?: string
          experience_id: string
          id?: string
          is_active?: boolean
          is_default_option?: boolean
          lodging_id: string
          room_type_id?: string | null
        }
        Update: {
          created_at?: string
          experience_id?: string
          id?: string
          is_active?: boolean
          is_default_option?: boolean
          lodging_id?: string
          room_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_lodgings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_lodgings_lodging_id_fkey"
            columns: ["lodging_id"]
            isOneToOne: false
            referencedRelation: "lodgings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_lodgings_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "lodging_room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          accessibility_notes: string | null
          accessible_children: boolean | null
          accessible_reduced_mobility: boolean | null
          arrival_tips: string | null
          available_days: Database["public"]["Enums"]["weekday"][] | null
          cancellation_policy: string | null
          cancellation_policy_type: string | null
          cover_image: string | null
          created_at: string
          description: string
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          difficulty_notes: string | null
          display_order: number | null
          duration_minutes: number
          duration_unit: Database["public"]["Enums"]["duration_unit"]
          end_point: string | null
          end_point_same: boolean | null
          environment_type: string[] | null
          extra_language_cost: boolean | null
          gallery_images: string[] | null
          id: string
          includes: string[] | null
          itinerary: Json | null
          languages: Database["public"]["Enums"]["experience_language"][] | null
          location_address: string | null
          location_city: string
          location_country: string | null
          location_department: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string
          lodging_required: boolean
          max_participants: number
          meeting_point_url: string | null
          min_participants: number | null
          not_includes: string[] | null
          price: number
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          recommended_season: string | null
          requirements: string[] | null
          "Se aceptan mascotas": boolean | null
          short_description: string | null
          slug: string
          start_time: string | null
          start_time_flexible: boolean | null
          status: Database["public"]["Enums"]["experience_status"]
          temperature_range: string | null
          title: string
          updated_at: string
          upsell_priority: number | null
        }
        Insert: {
          accessibility_notes?: string | null
          accessible_children?: boolean | null
          accessible_reduced_mobility?: boolean | null
          arrival_tips?: string | null
          available_days?: Database["public"]["Enums"]["weekday"][] | null
          cancellation_policy?: string | null
          cancellation_policy_type?: string | null
          cover_image?: string | null
          created_at?: string
          description: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          difficulty_notes?: string | null
          display_order?: number | null
          duration_minutes: number
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          end_point?: string | null
          end_point_same?: boolean | null
          environment_type?: string[] | null
          extra_language_cost?: boolean | null
          gallery_images?: string[] | null
          id?: string
          includes?: string[] | null
          itinerary?: Json | null
          languages?:
            | Database["public"]["Enums"]["experience_language"][]
            | null
          location_address?: string | null
          location_city: string
          location_country?: string | null
          location_department?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name: string
          lodging_required?: boolean
          max_participants?: number
          meeting_point_url?: string | null
          min_participants?: number | null
          not_includes?: string[] | null
          price: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          recommended_season?: string | null
          requirements?: string[] | null
          "Se aceptan mascotas"?: boolean | null
          short_description?: string | null
          slug: string
          start_time?: string | null
          start_time_flexible?: boolean | null
          status?: Database["public"]["Enums"]["experience_status"]
          temperature_range?: string | null
          title: string
          updated_at?: string
          upsell_priority?: number | null
        }
        Update: {
          accessibility_notes?: string | null
          accessible_children?: boolean | null
          accessible_reduced_mobility?: boolean | null
          arrival_tips?: string | null
          available_days?: Database["public"]["Enums"]["weekday"][] | null
          cancellation_policy?: string | null
          cancellation_policy_type?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          difficulty_notes?: string | null
          display_order?: number | null
          duration_minutes?: number
          duration_unit?: Database["public"]["Enums"]["duration_unit"]
          end_point?: string | null
          end_point_same?: boolean | null
          environment_type?: string[] | null
          extra_language_cost?: boolean | null
          gallery_images?: string[] | null
          id?: string
          includes?: string[] | null
          itinerary?: Json | null
          languages?:
            | Database["public"]["Enums"]["experience_language"][]
            | null
          location_address?: string | null
          location_city?: string
          location_country?: string | null
          location_department?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string
          lodging_required?: boolean
          max_participants?: number
          meeting_point_url?: string | null
          min_participants?: number | null
          not_includes?: string[] | null
          price?: number
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          recommended_season?: string | null
          requirements?: string[] | null
          "Se aceptan mascotas"?: boolean | null
          short_description?: string | null
          slug?: string
          start_time?: string | null
          start_time_flexible?: boolean | null
          status?: Database["public"]["Enums"]["experience_status"]
          temperature_range?: string | null
          title?: string
          updated_at?: string
          upsell_priority?: number | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      flipbook_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      flipbook_category_relations: {
        Row: {
          category_id: string
          created_at: string | null
          flipbook_id: string
          id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          flipbook_id: string
          id?: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          flipbook_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flipbook_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "flipbook_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flipbook_category_relations_flipbook_id_fkey"
            columns: ["flipbook_id"]
            isOneToOne: false
            referencedRelation: "flipbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      flipbook_experience_links: {
        Row: {
          created_at: string | null
          display_order: number | null
          experience_id: string
          flipbook_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          experience_id: string
          flipbook_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          experience_id?: string
          flipbook_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flipbook_experience_links_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flipbook_experience_links_flipbook_id_fkey"
            columns: ["flipbook_id"]
            isOneToOne: false
            referencedRelation: "flipbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      flipbooks: {
        Row: {
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string
          is_featured: boolean | null
          pdf_url: string
          slug: string
          status: Database["public"]["Enums"]["flipbook_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          pdf_url: string
          slug: string
          status?: Database["public"]["Enums"]["flipbook_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          pdf_url?: string
          slug?: string
          status?: Database["public"]["Enums"]["flipbook_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          badge: string | null
          created_at: string | null
          description: string | null
          display_order: number
          highlight: string
          id: string
          image_url: string
          is_active: boolean
          title: string
          updated_at: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          highlight: string
          id?: string
          image_url: string
          is_active?: boolean
          title: string
          updated_at?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          highlight?: string
          id?: string
          image_url?: string
          is_active?: boolean
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lodging_room_types: {
        Row: {
          base_price: number
          capacity: number
          created_at: string
          gallery_images: string[] | null
          id: string
          is_active: boolean
          lodging_id: string
          main_image_url: string | null
          name: string
          short_description: string | null
          units_available: number
        }
        Insert: {
          base_price?: number
          capacity?: number
          created_at?: string
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean
          lodging_id: string
          main_image_url?: string | null
          name: string
          short_description?: string | null
          units_available?: number
        }
        Update: {
          base_price?: number
          capacity?: number
          created_at?: string
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean
          lodging_id?: string
          main_image_url?: string | null
          name?: string
          short_description?: string | null
          units_available?: number
        }
        Relationships: [
          {
            foreignKeyName: "lodging_room_types_lodging_id_fkey"
            columns: ["lodging_id"]
            isOneToOne: false
            referencedRelation: "lodgings"
            referencedColumns: ["id"]
          },
        ]
      }
      lodging_seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          lodging_id: string
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          lodging_id: string
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          lodging_id?: string
          name?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "lodging_seasons_lodging_id_fkey"
            columns: ["lodging_id"]
            isOneToOne: false
            referencedRelation: "lodgings"
            referencedColumns: ["id"]
          },
        ]
      }
      lodgings: {
        Row: {
          address: string | null
          categories: string[] | null
          city: string
          created_at: string
          department: string | null
          gallery_images: string[] | null
          id: string
          is_active: boolean
          lodging_type: Database["public"]["Enums"]["lodging_type"]
          long_description: string | null
          main_image_url: string | null
          name: string
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          categories?: string[] | null
          city: string
          created_at?: string
          department?: string | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean
          lodging_type?: Database["public"]["Enums"]["lodging_type"]
          long_description?: string | null
          main_image_url?: string | null
          name: string
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          categories?: string[] | null
          city?: string
          created_at?: string
          department?: string | null
          gallery_images?: string[] | null
          id?: string
          is_active?: boolean
          lodging_type?: Database["public"]["Enums"]["lodging_type"]
          long_description?: string | null
          main_image_url?: string | null
          name?: string
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          artesania_id: string | null
          artesania_variante_id: string | null
          check_in_date: string | null
          check_out_date: string | null
          created_at: string | null
          experience_id: string | null
          id: string
          lodging_id: string | null
          lodging_room_type_id: string | null
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          artesania_id?: string | null
          artesania_variante_id?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          lodging_id?: string | null
          lodging_room_type_id?: string | null
          order_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          artesania_id?: string | null
          artesania_variante_id?: string | null
          check_in_date?: string | null
          check_out_date?: string | null
          created_at?: string | null
          experience_id?: string | null
          id?: string
          lodging_id?: string | null
          lodging_room_type_id?: string | null
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_artesania_id_fkey"
            columns: ["artesania_id"]
            isOneToOne: false
            referencedRelation: "artesanias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_artesania_variante_id_fkey"
            columns: ["artesania_variante_id"]
            isOneToOne: false
            referencedRelation: "artesania_variantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_experience_fk"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_lodging_id_fkey"
            columns: ["lodging_id"]
            isOneToOne: false
            referencedRelation: "lodgings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_lodging_room_type_id_fkey"
            columns: ["lodging_room_type_id"]
            isOneToOne: false
            referencedRelation: "lodging_room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          order_type: string
          payment_provider: string | null
          shipping_address: string | null
          shipping_city: string | null
          shipping_department: string | null
          shipping_notes: string | null
          status: string
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          order_type?: string
          payment_provider?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_department?: string | null
          shipping_notes?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          order_type?: string
          payment_provider?: string | null
          shipping_address?: string | null
          shipping_city?: string | null
          shipping_department?: string | null
          shipping_notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          order_id: string
          provider: string
          provider_reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          order_id: string
          provider: string
          provider_reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          order_id?: string
          provider?: string
          provider_reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_fk"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          created_at: string | null
          experience_id: string
          id: string
          is_active: boolean | null
          label: string
          max_pax: number | null
          min_pax: number | null
          origin_label: string | null
          price: number
          rule_type: Database["public"]["Enums"]["pricing_type"]
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          experience_id: string
          id?: string
          is_active?: boolean | null
          label: string
          max_pax?: number | null
          min_pax?: number | null
          origin_label?: string | null
          price: number
          rule_type: Database["public"]["Enums"]["pricing_type"]
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          experience_id?: string
          id?: string
          is_active?: boolean | null
          label?: string
          max_pax?: number | null
          min_pax?: number | null
          origin_label?: string | null
          price?: number
          rule_type?: Database["public"]["Enums"]["pricing_type"]
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pricing_rules_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          business_description: string | null
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string
          department: string | null
          document_number: string | null
          document_type: string | null
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          business_description?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          document_number?: string | null
          document_type?: string | null
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          business_description?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          department?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      room_season_rates: {
        Row: {
          created_at: string
          id: string
          price: number
          pricing_mode: string
          room_type_id: string
          season_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          pricing_mode?: string
          room_type_id: string
          season_id: string
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          pricing_mode?: string
          room_type_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_season_rates_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "lodging_room_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_season_rates_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "lodging_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_experience_availability: {
        Args: { _end_date: string; _experience_id: string; _start_date: string }
        Returns: {
          booked_spots: number
          booking_date: string
        }[]
      }
      get_lodging_calendar_prices: {
        Args: {
          _end_date: string
          _guests: number
          _lodging_id: string
          _room_type_id: string
          _start_date: string
        }
        Returns: {
          calendar_date: string
          price_per_night: number
          pricing_mode: string
          season_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user_pelicano" | "nido_proveedor" | "admin"
      artesania_categoria: "mochilas" | "portavasos" | "correas" | "manillas"
      artesania_estado: "borrador" | "publicado" | "desactivado"
      blog_category:
        | "destinos"
        | "cultura"
        | "gastronomia"
        | "aventura"
        | "consejos_de_viaje"
      blog_status: "borrador" | "publicado" | "archivado"
      difficulty_level: "baja" | "media" | "alta"
      duration_unit: "minutes" | "hours" | "days"
      experience_language:
        | "espanol"
        | "ingles"
        | "portugues"
        | "frances"
        | "aleman"
      experience_status: "borrador" | "activa" | "pausada" | "eliminada"
      flipbook_status: "draft" | "published" | "archived"
      lodging_type:
        | "posada"
        | "hotel"
        | "hostal"
        | "glamping"
        | "cabaña"
        | "finca"
      pricing_type:
        | "fixed"
        | "per_person"
        | "per_origin"
        | "per_accommodation"
        | "per_origin_accommodation"
      weekday:
        | "lunes"
        | "martes"
        | "miercoles"
        | "jueves"
        | "viernes"
        | "sabado"
        | "domingo"
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
      app_role: ["user_pelicano", "nido_proveedor", "admin"],
      artesania_categoria: ["mochilas", "portavasos", "correas", "manillas"],
      artesania_estado: ["borrador", "publicado", "desactivado"],
      blog_category: [
        "destinos",
        "cultura",
        "gastronomia",
        "aventura",
        "consejos_de_viaje",
      ],
      blog_status: ["borrador", "publicado", "archivado"],
      difficulty_level: ["baja", "media", "alta"],
      duration_unit: ["minutes", "hours", "days"],
      experience_language: [
        "espanol",
        "ingles",
        "portugues",
        "frances",
        "aleman",
      ],
      experience_status: ["borrador", "activa", "pausada", "eliminada"],
      flipbook_status: ["draft", "published", "archived"],
      lodging_type: [
        "posada",
        "hotel",
        "hostal",
        "glamping",
        "cabaña",
        "finca",
      ],
      pricing_type: [
        "fixed",
        "per_person",
        "per_origin",
        "per_accommodation",
        "per_origin_accommodation",
      ],
      weekday: [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo",
      ],
    },
  },
} as const
