PGDMP                      }           Deloitte-Planning-DEV    17.5    17.5 O                0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            !           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            "           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            #           1262    16855    Deloitte-Planning-DEV    DATABASE     �   CREATE DATABASE "Deloitte-Planning-DEV" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'French_France.1252';
 '   DROP DATABASE "Deloitte-Planning-DEV";
                     postgres    false            $           0    0     DATABASE "Deloitte-Planning-DEV"    COMMENT     ;   COMMENT ON DATABASE "Deloitte-Planning-DEV" IS 'Planning';
                        postgres    false    4899            �            1259    16856    affectations    TABLE     �   CREATE TABLE public.affectations (
    id_affectations integer NOT NULL,
    semaine date NOT NULL,
    pourcentage integer NOT NULL,
    commentaire character varying(255),
    id_projet integer NOT NULL,
    id_plannings integer NOT NULL
);
     DROP TABLE public.affectations;
       public         heap r       postgres    false            �            1259    16859     affectations_id_affectations_seq    SEQUENCE     �   CREATE SEQUENCE public.affectations_id_affectations_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public.affectations_id_affectations_seq;
       public               postgres    false    217            %           0    0     affectations_id_affectations_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public.affectations_id_affectations_seq OWNED BY public.affectations.id_affectations;
          public               postgres    false    218            �            1259    16860    equipe    TABLE     g   CREATE TABLE public.equipe (
    id_equipe integer NOT NULL,
    nom character varying(50) NOT NULL
);
    DROP TABLE public.equipe;
       public         heap r       postgres    false            �            1259    16863    equipe_id_equipe_seq    SEQUENCE     �   CREATE SEQUENCE public.equipe_id_equipe_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.equipe_id_equipe_seq;
       public               postgres    false    219            &           0    0    equipe_id_equipe_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.equipe_id_equipe_seq OWNED BY public.equipe.id_equipe;
          public               postgres    false    220            �            1259    16864    equipe_utilisateur    TABLE     �   CREATE TABLE public.equipe_utilisateur (
    id_equipe integer NOT NULL,
    id_utilisateur integer NOT NULL,
    role_equipe character varying(50) NOT NULL
);
 &   DROP TABLE public.equipe_utilisateur;
       public         heap r       postgres    false            �            1259    16867    localisation    TABLE     s   CREATE TABLE public.localisation (
    id_localisation integer NOT NULL,
    nom character varying(50) NOT NULL
);
     DROP TABLE public.localisation;
       public         heap r       postgres    false            �            1259    16870     localisation_id_localisation_seq    SEQUENCE     �   CREATE SEQUENCE public.localisation_id_localisation_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public.localisation_id_localisation_seq;
       public               postgres    false    222            '           0    0     localisation_id_localisation_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public.localisation_id_localisation_seq OWNED BY public.localisation.id_localisation;
          public               postgres    false    223            �            1259    16871    motifpresence    TABLE     y   CREATE TABLE public.motifpresence (
    id_motifpresence integer NOT NULL,
    libelle character varying(50) NOT NULL
);
 !   DROP TABLE public.motifpresence;
       public         heap r       postgres    false            �            1259    16874 "   motifpresence_id_motifpresence_seq    SEQUENCE     �   CREATE SEQUENCE public.motifpresence_id_motifpresence_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 9   DROP SEQUENCE public.motifpresence_id_motifpresence_seq;
       public               postgres    false    224            (           0    0 "   motifpresence_id_motifpresence_seq    SEQUENCE OWNED BY     i   ALTER SEQUENCE public.motifpresence_id_motifpresence_seq OWNED BY public.motifpresence.id_motifpresence;
          public               postgres    false    225            �            1259    16875    planningjour    TABLE     �   CREATE TABLE public.planningjour (
    id_planningjour integer NOT NULL,
    jour character varying(10) NOT NULL,
    id_localisation integer,
    id_motifpresence integer NOT NULL,
    id_plannings integer NOT NULL
);
     DROP TABLE public.planningjour;
       public         heap r       postgres    false            �            1259    16878     planningjour_id_planningjour_seq    SEQUENCE     �   CREATE SEQUENCE public.planningjour_id_planningjour_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public.planningjour_id_planningjour_seq;
       public               postgres    false    226            )           0    0     planningjour_id_planningjour_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public.planningjour_id_planningjour_seq OWNED BY public.planningjour.id_planningjour;
          public               postgres    false    227            �            1259    16879 	   plannings    TABLE     �   CREATE TABLE public.plannings (
    id_plannings integer NOT NULL,
    date_debut_semaine date NOT NULL,
    copie_auto boolean NOT NULL,
    id_utilisateur integer NOT NULL
);
    DROP TABLE public.plannings;
       public         heap r       postgres    false            �            1259    16882    plannings_id_plannings_seq    SEQUENCE     �   CREATE SEQUENCE public.plannings_id_plannings_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.plannings_id_plannings_seq;
       public               postgres    false    228            *           0    0    plannings_id_plannings_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.plannings_id_plannings_seq OWNED BY public.plannings.id_plannings;
          public               postgres    false    229            �            1259    16883 	   presences    TABLE       CREATE TABLE public.presences (
    year integer NOT NULL,
    week integer NOT NULL,
    id_utilisateur integer NOT NULL,
    presences jsonb NOT NULL,
    code_projet character varying(50),
    desc_projet character varying(255),
    codes_projet text
);
    DROP TABLE public.presences;
       public         heap r       postgres    false            �            1259    16888    projet    TABLE     �  CREATE TABLE public.projet (
    id_projet integer NOT NULL,
    nom character varying(50) NOT NULL,
    description character varying(255) DEFAULT ''::character varying,
    date_creation date DEFAULT CURRENT_DATE NOT NULL,
    actif boolean DEFAULT true NOT NULL,
    code_projet character varying(255) NOT NULL,
    id_utilisateur integer,
    year integer DEFAULT 2024 NOT NULL,
    week integer DEFAULT 1 NOT NULL,
    pourcentage integer,
    commentaire character varying(255)
);
    DROP TABLE public.projet;
       public         heap r       postgres    false            �            1259    16898    projet_id_projet_seq    SEQUENCE     �   CREATE SEQUENCE public.projet_id_projet_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 +   DROP SEQUENCE public.projet_id_projet_seq;
       public               postgres    false    231            +           0    0    projet_id_projet_seq    SEQUENCE OWNED BY     M   ALTER SEQUENCE public.projet_id_projet_seq OWNED BY public.projet.id_projet;
          public               postgres    false    232            �            1259    16899    utilisateur    TABLE     �  CREATE TABLE public.utilisateur (
    id_utilisateur integer NOT NULL,
    nom character varying(50) NOT NULL,
    prenom character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    actif boolean NOT NULL,
    date_creation date NOT NULL,
    id_equipe integer NOT NULL,
    password character varying(255) NOT NULL,
    is_visible boolean DEFAULT true
);
    DROP TABLE public.utilisateur;
       public         heap r       postgres    false            �            1259    16905    utilisateur_id_utilisateur_seq    SEQUENCE     �   CREATE SEQUENCE public.utilisateur_id_utilisateur_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 5   DROP SEQUENCE public.utilisateur_id_utilisateur_seq;
       public               postgres    false    233            ,           0    0    utilisateur_id_utilisateur_seq    SEQUENCE OWNED BY     a   ALTER SEQUENCE public.utilisateur_id_utilisateur_seq OWNED BY public.utilisateur.id_utilisateur;
          public               postgres    false    234            L           2604    16906    affectations id_affectations    DEFAULT     �   ALTER TABLE ONLY public.affectations ALTER COLUMN id_affectations SET DEFAULT nextval('public.affectations_id_affectations_seq'::regclass);
 K   ALTER TABLE public.affectations ALTER COLUMN id_affectations DROP DEFAULT;
       public               postgres    false    218    217            M           2604    16907    equipe id_equipe    DEFAULT     t   ALTER TABLE ONLY public.equipe ALTER COLUMN id_equipe SET DEFAULT nextval('public.equipe_id_equipe_seq'::regclass);
 ?   ALTER TABLE public.equipe ALTER COLUMN id_equipe DROP DEFAULT;
       public               postgres    false    220    219            N           2604    16908    localisation id_localisation    DEFAULT     �   ALTER TABLE ONLY public.localisation ALTER COLUMN id_localisation SET DEFAULT nextval('public.localisation_id_localisation_seq'::regclass);
 K   ALTER TABLE public.localisation ALTER COLUMN id_localisation DROP DEFAULT;
       public               postgres    false    223    222            O           2604    16909    motifpresence id_motifpresence    DEFAULT     �   ALTER TABLE ONLY public.motifpresence ALTER COLUMN id_motifpresence SET DEFAULT nextval('public.motifpresence_id_motifpresence_seq'::regclass);
 M   ALTER TABLE public.motifpresence ALTER COLUMN id_motifpresence DROP DEFAULT;
       public               postgres    false    225    224            P           2604    16910    planningjour id_planningjour    DEFAULT     �   ALTER TABLE ONLY public.planningjour ALTER COLUMN id_planningjour SET DEFAULT nextval('public.planningjour_id_planningjour_seq'::regclass);
 K   ALTER TABLE public.planningjour ALTER COLUMN id_planningjour DROP DEFAULT;
       public               postgres    false    227    226            Q           2604    16911    plannings id_plannings    DEFAULT     �   ALTER TABLE ONLY public.plannings ALTER COLUMN id_plannings SET DEFAULT nextval('public.plannings_id_plannings_seq'::regclass);
 E   ALTER TABLE public.plannings ALTER COLUMN id_plannings DROP DEFAULT;
       public               postgres    false    229    228            R           2604    16912    projet id_projet    DEFAULT     t   ALTER TABLE ONLY public.projet ALTER COLUMN id_projet SET DEFAULT nextval('public.projet_id_projet_seq'::regclass);
 ?   ALTER TABLE public.projet ALTER COLUMN id_projet DROP DEFAULT;
       public               postgres    false    232    231            X           2604    16913    utilisateur id_utilisateur    DEFAULT     �   ALTER TABLE ONLY public.utilisateur ALTER COLUMN id_utilisateur SET DEFAULT nextval('public.utilisateur_id_utilisateur_seq'::regclass);
 I   ALTER TABLE public.utilisateur ALTER COLUMN id_utilisateur DROP DEFAULT;
       public               postgres    false    234    233                      0    16856    affectations 
   TABLE DATA           s   COPY public.affectations (id_affectations, semaine, pourcentage, commentaire, id_projet, id_plannings) FROM stdin;
    public               postgres    false    217   f                 0    16860    equipe 
   TABLE DATA           0   COPY public.equipe (id_equipe, nom) FROM stdin;
    public               postgres    false    219   1f                 0    16864    equipe_utilisateur 
   TABLE DATA           T   COPY public.equipe_utilisateur (id_equipe, id_utilisateur, role_equipe) FROM stdin;
    public               postgres    false    221   yf                 0    16867    localisation 
   TABLE DATA           <   COPY public.localisation (id_localisation, nom) FROM stdin;
    public               postgres    false    222   �f                 0    16871    motifpresence 
   TABLE DATA           B   COPY public.motifpresence (id_motifpresence, libelle) FROM stdin;
    public               postgres    false    224   �f                 0    16875    planningjour 
   TABLE DATA           n   COPY public.planningjour (id_planningjour, jour, id_localisation, id_motifpresence, id_plannings) FROM stdin;
    public               postgres    false    226   g                 0    16879 	   plannings 
   TABLE DATA           a   COPY public.plannings (id_plannings, date_debut_semaine, copie_auto, id_utilisateur) FROM stdin;
    public               postgres    false    228   )g                 0    16883 	   presences 
   TABLE DATA           r   COPY public.presences (year, week, id_utilisateur, presences, code_projet, desc_projet, codes_projet) FROM stdin;
    public               postgres    false    230   Fg                 0    16888    projet 
   TABLE DATA           �   COPY public.projet (id_projet, nom, description, date_creation, actif, code_projet, id_utilisateur, year, week, pourcentage, commentaire) FROM stdin;
    public               postgres    false    231   �g                 0    16899    utilisateur 
   TABLE DATA           �   COPY public.utilisateur (id_utilisateur, nom, prenom, email, role, actif, date_creation, id_equipe, password, is_visible) FROM stdin;
    public               postgres    false    233   �h       -           0    0     affectations_id_affectations_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.affectations_id_affectations_seq', 1, false);
          public               postgres    false    218            .           0    0    equipe_id_equipe_seq    SEQUENCE SET     B   SELECT pg_catalog.setval('public.equipe_id_equipe_seq', 5, true);
          public               postgres    false    220            /           0    0     localisation_id_localisation_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.localisation_id_localisation_seq', 1, false);
          public               postgres    false    223            0           0    0 "   motifpresence_id_motifpresence_seq    SEQUENCE SET     Q   SELECT pg_catalog.setval('public.motifpresence_id_motifpresence_seq', 1, false);
          public               postgres    false    225            1           0    0     planningjour_id_planningjour_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.planningjour_id_planningjour_seq', 1, false);
          public               postgres    false    227            2           0    0    plannings_id_plannings_seq    SEQUENCE SET     I   SELECT pg_catalog.setval('public.plannings_id_plannings_seq', 1, false);
          public               postgres    false    229            3           0    0    projet_id_projet_seq    SEQUENCE SET     C   SELECT pg_catalog.setval('public.projet_id_projet_seq', 27, true);
          public               postgres    false    232            4           0    0    utilisateur_id_utilisateur_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.utilisateur_id_utilisateur_seq', 14, true);
          public               postgres    false    234            [           2606    16915    affectations affectations_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.affectations
    ADD CONSTRAINT affectations_pkey PRIMARY KEY (id_affectations);
 H   ALTER TABLE ONLY public.affectations DROP CONSTRAINT affectations_pkey;
       public                 postgres    false    217            ]           2606    16917    equipe equipe_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.equipe
    ADD CONSTRAINT equipe_pkey PRIMARY KEY (id_equipe);
 <   ALTER TABLE ONLY public.equipe DROP CONSTRAINT equipe_pkey;
       public                 postgres    false    219            _           2606    16919 *   equipe_utilisateur equipe_utilisateur_pkey 
   CONSTRAINT        ALTER TABLE ONLY public.equipe_utilisateur
    ADD CONSTRAINT equipe_utilisateur_pkey PRIMARY KEY (id_equipe, id_utilisateur);
 T   ALTER TABLE ONLY public.equipe_utilisateur DROP CONSTRAINT equipe_utilisateur_pkey;
       public                 postgres    false    221    221            a           2606    16921    localisation localisation_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.localisation
    ADD CONSTRAINT localisation_pkey PRIMARY KEY (id_localisation);
 H   ALTER TABLE ONLY public.localisation DROP CONSTRAINT localisation_pkey;
       public                 postgres    false    222            c           2606    16923     motifpresence motifpresence_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.motifpresence
    ADD CONSTRAINT motifpresence_pkey PRIMARY KEY (id_motifpresence);
 J   ALTER TABLE ONLY public.motifpresence DROP CONSTRAINT motifpresence_pkey;
       public                 postgres    false    224            e           2606    16925    planningjour planningjour_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.planningjour
    ADD CONSTRAINT planningjour_pkey PRIMARY KEY (id_planningjour);
 H   ALTER TABLE ONLY public.planningjour DROP CONSTRAINT planningjour_pkey;
       public                 postgres    false    226            g           2606    16927    plannings plannings_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_pkey PRIMARY KEY (id_plannings);
 B   ALTER TABLE ONLY public.plannings DROP CONSTRAINT plannings_pkey;
       public                 postgres    false    228            i           2606    16929    presences presences_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_pkey PRIMARY KEY (year, week, id_utilisateur);
 B   ALTER TABLE ONLY public.presences DROP CONSTRAINT presences_pkey;
       public                 postgres    false    230    230    230            l           2606    16931    projet projet_pkey 
   CONSTRAINT     W   ALTER TABLE ONLY public.projet
    ADD CONSTRAINT projet_pkey PRIMARY KEY (id_projet);
 <   ALTER TABLE ONLY public.projet DROP CONSTRAINT projet_pkey;
       public                 postgres    false    231            n           2606    16933 !   utilisateur utilisateur_email_key 
   CONSTRAINT     ]   ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_email_key UNIQUE (email);
 K   ALTER TABLE ONLY public.utilisateur DROP CONSTRAINT utilisateur_email_key;
       public                 postgres    false    233            p           2606    16935    utilisateur utilisateur_pkey 
   CONSTRAINT     f   ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_pkey PRIMARY KEY (id_utilisateur);
 F   ALTER TABLE ONLY public.utilisateur DROP CONSTRAINT utilisateur_pkey;
       public                 postgres    false    233            j           1259    16936    presences_user_week_year_idx    INDEX     h   CREATE INDEX presences_user_week_year_idx ON public.presences USING btree (id_utilisateur, year, week);
 0   DROP INDEX public.presences_user_week_year_idx;
       public                 postgres    false    230    230    230            q           2606    16937 +   affectations affectations_id_plannings_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.affectations
    ADD CONSTRAINT affectations_id_plannings_fkey FOREIGN KEY (id_plannings) REFERENCES public.plannings(id_plannings);
 U   ALTER TABLE ONLY public.affectations DROP CONSTRAINT affectations_id_plannings_fkey;
       public               postgres    false    217    4711    228            r           2606    16942 (   affectations affectations_id_projet_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.affectations
    ADD CONSTRAINT affectations_id_projet_fkey FOREIGN KEY (id_projet) REFERENCES public.projet(id_projet);
 R   ALTER TABLE ONLY public.affectations DROP CONSTRAINT affectations_id_projet_fkey;
       public               postgres    false    4716    231    217            s           2606    16947 4   equipe_utilisateur equipe_utilisateur_id_equipe_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.equipe_utilisateur
    ADD CONSTRAINT equipe_utilisateur_id_equipe_fkey FOREIGN KEY (id_equipe) REFERENCES public.equipe(id_equipe) ON DELETE CASCADE;
 ^   ALTER TABLE ONLY public.equipe_utilisateur DROP CONSTRAINT equipe_utilisateur_id_equipe_fkey;
       public               postgres    false    219    4701    221            t           2606    16952 9   equipe_utilisateur equipe_utilisateur_id_utilisateur_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.equipe_utilisateur
    ADD CONSTRAINT equipe_utilisateur_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur) ON DELETE CASCADE;
 c   ALTER TABLE ONLY public.equipe_utilisateur DROP CONSTRAINT equipe_utilisateur_id_utilisateur_fkey;
       public               postgres    false    233    4720    221            u           2606    16957 .   planningjour planningjour_id_localisation_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.planningjour
    ADD CONSTRAINT planningjour_id_localisation_fkey FOREIGN KEY (id_localisation) REFERENCES public.localisation(id_localisation);
 X   ALTER TABLE ONLY public.planningjour DROP CONSTRAINT planningjour_id_localisation_fkey;
       public               postgres    false    4705    226    222            v           2606    16962 /   planningjour planningjour_id_motifpresence_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.planningjour
    ADD CONSTRAINT planningjour_id_motifpresence_fkey FOREIGN KEY (id_motifpresence) REFERENCES public.motifpresence(id_motifpresence);
 Y   ALTER TABLE ONLY public.planningjour DROP CONSTRAINT planningjour_id_motifpresence_fkey;
       public               postgres    false    4707    226    224            w           2606    16967 +   planningjour planningjour_id_plannings_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.planningjour
    ADD CONSTRAINT planningjour_id_plannings_fkey FOREIGN KEY (id_plannings) REFERENCES public.plannings(id_plannings);
 U   ALTER TABLE ONLY public.planningjour DROP CONSTRAINT planningjour_id_plannings_fkey;
       public               postgres    false    228    4711    226            x           2606    16972 '   plannings plannings_id_utilisateur_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.plannings
    ADD CONSTRAINT plannings_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur);
 Q   ALTER TABLE ONLY public.plannings DROP CONSTRAINT plannings_id_utilisateur_fkey;
       public               postgres    false    233    228    4720            y           2606    16977 !   projet projet_id_utilisateur_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.projet
    ADD CONSTRAINT projet_id_utilisateur_fkey FOREIGN KEY (id_utilisateur) REFERENCES public.utilisateur(id_utilisateur);
 K   ALTER TABLE ONLY public.projet DROP CONSTRAINT projet_id_utilisateur_fkey;
       public               postgres    false    231    233    4720            z           2606    16982 &   utilisateur utilisateur_id_equipe_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.utilisateur
    ADD CONSTRAINT utilisateur_id_equipe_fkey FOREIGN KEY (id_equipe) REFERENCES public.equipe(id_equipe);
 P   ALTER TABLE ONLY public.utilisateur DROP CONSTRAINT utilisateur_id_equipe_fkey;
       public               postgres    false    233    219    4701                  x������ � �         8   x�3��M�KLO-�2��/JL�I�2�LL����2�qu�2�t��K�KN����� J��         I   x�3�4�LL����2�4��M�M*J�2�@0�`LS ��� ���Ј371/1=��1������0v� ���            x������ � �            x������ � �            x������ � �            x������ � �         q   x�3202�46�4�6�Q@�X�?�VR�AB�\F`X4p�Pld	UlViD �1~pi�Y@9c�:di�U��`yC�	 %Ǖ��蚘��3-�-,al$a4f,W� ��0�         �   x���=
�@��yw1쟺��C�"��W0��y/�U�	�"��a��y� ��#�F\���ʣ8-%D����I�>��Л�ⷐ�2�2��8��Nh����B:N��e �H�$���&H��4�u�5]K"�Ŗy��N�r���n;�D
S���N��V��� WI�         &  x����v�@ �u���iwPD^P�g6�#�~�q�3ɼ6u�j���%>����S<%UB�ȼ܋pJ i�=��3�<��C?�Bt
�D�"k����Ѕ��o�dȴL�K\�"�\e|�k��S\�G>��Z�?���xl��U�}84vCO=(5]��C�2�a�3r�2�Wה�()e:���$��2&yn�4�)I��$z,iN�8XZ��=�B"&�.�9�]j=ܯ��]�A�(Q����HH8�IU�@ks������C��
a�
$_�O[~�V�X1ۭ�"�E2FFzJ�B�t�/r�ʙ]��ݛ�1н�=�>���zԟ�ի�&��>��y���b��R��MjJ+�Z~V�µ]�jIGq]y�:�/��]@ ��|�c/#:qc��=�G�o_���V�	��J1r���׍���4�;r� Kr`W�۷�.�$�S>������?�N��Y��Q�\�-�X師L�����a�����#@�1��o�$�=k��K,�e�`kr86xo�ܦ.�{�͗��=|;C��7j0|hg%d     