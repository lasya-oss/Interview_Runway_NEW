import { isActiveDriveRecord } from "./active-library-selection";

export type DriveMaterialKind =
  | "template"
  | "narrated"
  | "silent"
  | "transcript"
  | "caption"
  | "storyboard"
  | "mock-audio"
  | "mock-script"
  | "manifest";

export type DriveMaterial = {
  id: string;
  filename: string;
  mimeType: string;
  bytes: number;
  collection: string;
  kind: DriveMaterialKind;
};

export const DRIVE_MATERIALS: readonly DriveMaterial[] = [
  {
    "id": "1RY9eae4F8Vl2B9q87oJTMePLYzOVXjY1",
    "filename": "template_weekly-prep-tracker.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38929,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1bCauXluLVTdsgtg-P9Kn6zRYyMrQj987",
    "filename": "template_us-ats-resume.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38653,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1smigd6o2aui_Svltz6sS-hpQ9xSY6dtN",
    "filename": "template_title-translation-guide.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 39102,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1UTOv3P32mStXw2AITo2hvKwtdr1iPrbU",
    "filename": "template_thank-you.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38769,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1ee3B5_ysAwlaO3NACtT8ka7wvNkzbT0l",
    "filename": "template_system-design-canvas.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38878,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1D_C1EgAAF-kTQuzYOEopATVWBJEcO4HE",
    "filename": "template_stay-in-touch.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38814,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "18QqOx06QgEVcS6jvshFa0CMrn1jfgbo7",
    "filename": "template_remote-cover-letter.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 39022,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1vs05pK6zvG4UoDoEYFx81xW3ncEwLwyG",
    "filename": "template_recruiter-screen-notes.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38806,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1ZlZuG31v3KdC4VCvUjYttcpOCm08RHE-",
    "filename": "template_outreach-referral.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38833,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1GSL_dK_XcDSMbH0BQfLv381D98ZNNFk-",
    "filename": "template_outreach-recruiter.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38796,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1e1vEkRjvdncj4KafywQgK41uhzY9xnUF",
    "filename": "template_outreach-hiring-manager.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38810,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1t9xelCedEMoUnb0PnR9Pt3ktUSKzq7IR",
    "filename": "template_negotiation-timeline-extension.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38876,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1ugzcuqE4Aev4ui9btInIlTSw12ulUgZf",
    "filename": "template_interview-availability.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38751,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1xsv2IFBf8UNzVbrBP369TsWdCyOG_vzk",
    "filename": "template_linkedin-profile.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38952,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1XtLIeyeAIZHl2B2TgKMWtH87AhapgXKj",
    "filename": "template_negotiation-initial-counter.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38993,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1ZAoYXdqw0nECL1_hKgWyjnTjSHGtGLTi",
    "filename": "template_behavioral-story-bank.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38794,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1CfFgwNG3hkSmEB9BTVDD-myzcS-RJca5",
    "filename": "template_follow-up-recruiter.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38803,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1I3oUUApuhh2bIQ6NRsQewZry3qLRUg10",
    "filename": "template_negotiation-multiple-offers.docx",
    "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "bytes": 38970,
    "collection": "Editable Word templates",
    "kind": "template"
  },
  {
    "id": "1SGicRU1TO2UgZ8px1FzHIj9SABFCdDze",
    "filename": "sysdesign_url-shortener_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10053108,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1r1l0vPXjm-ou8vMDgqCrwI-gOlxZtKGf",
    "filename": "sysdesign_thundering-herd_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10650739,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1CePtwfTzivV0q7Kah0QE-eSbNVoH2Hhz",
    "filename": "sysdesign_sql-vs-nosql_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10557984,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1jHdmlbiX5J3CA4KOWUkIC5Mg34cnnX3H",
    "filename": "sysdesign_service-discovery_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10483663,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1wl_OjWs6oQyeMAQJA-rYUGq9YAd478Lt",
    "filename": "sysdesign_search-autocomplete_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10506113,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1hslIyNgzX1KS5AUWpW_oC_v7TgPKai0c",
    "filename": "sysdesign_ride-sharing-dispatch_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10721098,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1vS-Ec5qxxor4mUt8Jnr1pf09qOPExXr-",
    "filename": "sysdesign_rate-limiting_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10405247,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1o0yQpm6I8XUeIcZKm0gF-fGVmqx-zYIw",
    "filename": "sysdesign_rate-limiter_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10690171,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1XrLfHEiPulMt7QKXjbbKPMKG_QIo5hr4",
    "filename": "sysdesign_quorums_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10775446,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "15w644tdq0FoX1sz3Vs-dUsMF1Fsish1I",
    "filename": "sysdesign_queue-semantics_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10862457,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1Z9Hz8ti2AhBPTRxBj5FcTBAvBhs9hDGW",
    "filename": "sysdesign_payment-system_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10799865,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1vQSQNA5ZpTdImZ7HM5EQbyJose6wvzZk",
    "filename": "sysdesign_observability_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10317828,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1tOWE5oEFkny-AO2bfcDwzeBYcu5JKYgc",
    "filename": "sysdesign_news-feed_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10599212,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1vi7r8D3V5FXU-oMAu4XbmKLUVqHhIrYN",
    "filename": "sysdesign_notification-system_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10717066,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1EzHEiROn77aB8Nd9oWiIcZH-L2UUS4Ej",
    "filename": "sysdesign_multi-region_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10987905,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1Y87Kin2cKM_tUNWs4izYOZI_CH9rKoj1",
    "filename": "sysdesign_microservices-vs-monolith_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10453092,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1ESwEhoFcLMVbkoU2NQTc4u7f7PB44wdY",
    "filename": "sysdesign_message-queues_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10813906,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1UDA4GLjYTIUsJz-qR9XhW6bvmAKZfWi0",
    "filename": "sysdesign_load-balancing_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10441082,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1JailCqPfeZAlAkHG4RHjE07VodCCa1qL",
    "filename": "sysdesign_job-scheduler_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11081522,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1Qt-L4olZYJRpBivxZ4Wzzn1HO_gBXkQi",
    "filename": "sysdesign_idempotency_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10581352,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1DDqreDb8YBgfdzz4bgo14zkaJjNXZe4o",
    "filename": "sysdesign_id-generation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11230010,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1WOPhwby9a1Q7f4946VAlb8X_M2G8mavs",
    "filename": "sysdesign_hot-keys_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10587298,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1dCM_DiN21Gy4DYJpr1VAcjlfPV9ZuCwq",
    "filename": "sysdesign_file-storage-service_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10163035,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1ES3tI2X3laYE5nSJusdO9q66ubWoYFPY",
    "filename": "sysdesign_fault-tolerance_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10470026,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "12uBB-4OtYq-5ycJPlG8s5YqmEsiXsg7E",
    "filename": "sysdesign_failure-analysis_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10626191,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1hZv8zqMVQydDzPk68TtiMhd3SKRgqES5",
    "filename": "sysdesign_eventual-consistency_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10829818,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1SjbCewnnLaq4n6HesyM-TrCkp491Nv2x",
    "filename": "sysdesign_distributed-transactions_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10802821,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1EB5Pd1XSxZP7ZkvmiSaO-zvN5OVdrnU7",
    "filename": "sysdesign_database-sharding_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10266622,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1baST6fIxGHVoSrqF5qpOoDcSUWkKnrhN",
    "filename": "sysdesign_database-replication_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10507192,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1ot6jo1A7f7QEAz3uK2hQdDJKhZAUkdeU",
    "filename": "sysdesign_database-indexing_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10924210,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1GYEfGWRYQndt9ZJi4n4oHXm9GojgLA_M",
    "filename": "sysdesign_data-modeling_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10632926,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1vAMIsFNrdyxMTtW9UTlhD42bu88enEE0",
    "filename": "sysdesign_consistent-hashing_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10228634,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1rU9DKwJ6aHPu56R_coyg1rZKM9am9sED",
    "filename": "sysdesign_chat-system_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10161197,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1aBzYohH4e-_bWK6D0rCjO7F1xOjMa01a",
    "filename": "sysdesign_cdn_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11237812,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1z4SKhs-tyzRI0OlrkmF8zjenBxVLWlib",
    "filename": "sysdesign_capacity-estimation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10488486,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1rKz5Pku7u0zSUDyQPWt-Vdcg0hs4iTjn",
    "filename": "sysdesign_cap-theorem_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10915611,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1JdRoOSoEFvmzwTBvT2Ha5_ILvsgUQ9Nh",
    "filename": "sysdesign_caching_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 9915748,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "11iwuVFIm2lBBAH_1RIFZO4ni5HWcwkow",
    "filename": "sysdesign_cache-invalidation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10250755,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1168wcZ8jPz5Hx48r9qVVPzsmslRpb3cg",
    "filename": "sysdesign_backpressure_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10820093,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1S0JXBhIY6F98M4vttAo_83reHNvky9k3",
    "filename": "sysdesign_api-gateway_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10300286,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1SiSOf1dfq2eFCUWUAGHUoADFAWZrX9re",
    "filename": "remote_visa-myths_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12572106,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1_R-xUmC_29qAaxFnArXmxmMcnpum4B1h",
    "filename": "remote_usd-payment-options_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12727341,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1BhRYmB4SfuUm1gCfr62G_-7TYCcJkkiz",
    "filename": "remote_timezone-overlap_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12180927,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "129Lp9GgY6SP2bILPrjEnDcROKiBDBt2l",
    "filename": "remote_security-and-equipment_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12113197,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1yr77sX_cyG4SM2ZgDBucOOpgdZsf_HW_",
    "filename": "remote_remote-income-records_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12648426,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1l6GL_md2R1meVWRhcraLGNtXuWs5WcEy",
    "filename": "remote_payment-platform-comparison_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12619489,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1zHuUn-o22c98841mcGWC6P0n7d3IOxj2",
    "filename": "remote_offer-scam-checks_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12498472,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "18qDpRLPfZDPcVJQR2l69wFQHRAMThK_2",
    "filename": "remote_india-tax-basics_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12386378,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "14ENmYH3zzuTlPK3yCsB1oteRRknaxYgH",
    "filename": "remote_eor-vs-contractor_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12820086,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1SFXLtNJo5Az6ltxsvMQIr-HbZTg8M_xU",
    "filename": "remote_employee-vs-contractor_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12509724,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1OZtOD7LSF9eH61ccjTXr0b6Wv_Hqfz7t",
    "filename": "remote_contract-red-flags_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 13147785,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1VYOV6wuqtUoqWt5Hoy6HHYb_LUWqXQgV",
    "filename": "remote_comp-negotiation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12250455,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1KfomoWcdJlsWY3tC019xZJTOHaTdh-dY",
    "filename": "remote_comp-benchmarking_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12303789,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1EDVLmSZ2fZNSLmsh8FzkivFNs7pt6nRY",
    "filename": "remote_async-collaboration_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 12281224,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1oF7FkmO3wUCG-SuKEgHk9Q_8brp96TUv",
    "filename": "dsa_union-find_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10879674,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1zpdyEH7PdgZ9ebRAicQOVkRACI43vKyp",
    "filename": "dsa_two-pointers_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10787756,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1S57RWAT0fP37nIUFcKPZwlhWqSR1AU6G",
    "filename": "dsa_union-find_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11309064,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1jJO-kCk01heIkEl0kQ1D9FhwbNUlA-KN",
    "filename": "dsa_two-pointers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11634621,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1eHEudsJ6fEY20zkXV2y1E6A4Q3kOQ2by",
    "filename": "dsa_trie_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11451694,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1C_KQIaNhPammrTbCDJBvMNx920KiY480",
    "filename": "dsa_trie_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11693240,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1qK8TXlYEGTuq31paRo0I2kryKMIW82A-",
    "filename": "dsa_topological-sort_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10834303,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "16mFUXxVTGfNxTSHVDyGepE6qU1Fv0Iu8",
    "filename": "dsa_topological-sort_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10940178,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1EvOiqnBiyr-hlup2kWm3vm5k-GAo--AH",
    "filename": "dsa_sliding-window_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 12393624,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1QFQhLEA-jd8RAsVgQGIXHJIb5EfjjFEu",
    "filename": "dsa_sliding-window_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11433941,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1qB_m1tRTIHhC1L4oIusiIvP-4kHCSP4u",
    "filename": "dsa_shortest-path_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11177465,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "12Ll5yuWlVLGKsK6IByOVI1mNvpOQQpnF",
    "filename": "dsa_shortest-path_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11807712,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1j0YXjMraI0FcK-YFFajPHF8CVqHBTNVq",
    "filename": "dsa_prefix-sum_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10923798,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "18slwJpJv44CfqvMZdyj7L8MOWo27nsqb",
    "filename": "dsa_prefix-sum_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11630993,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1LqYA_vbVqHVtizpr2BakqHMVvDv7Cm1S",
    "filename": "dsa_monotonic-stack_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11259254,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1kfMO9PwUnbRF2qrIKxtExfgwlyEPF9Gi",
    "filename": "dsa_monotonic-stack_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11543699,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1nUQb04TlVt5U4c5YvBq50i_cDOUgjyyp",
    "filename": "dsa_intervals_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10989550,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1nWWv5E0HJ0xVjjuQZyYlkIG5KpargxB7",
    "filename": "dsa_heap-priority-queue_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11219119,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1MjixtSMSTPKktEJryKOS1q4jnp3k5f7U",
    "filename": "dsa_intervals_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10885762,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1l0uT5YNs3TW5DdgeHsuK71Y7ZHHXfLDu",
    "filename": "dsa_heap-priority-queue_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11691823,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1cW2ZsQvhvFMa1znBos-xjU0xbB55wyzx",
    "filename": "dsa_hash-maps_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11271307,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1poAiYO6UxcNrFOBpMx-6CV9LuKP7qWIq",
    "filename": "dsa_hash-maps_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11565836,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "14-S1KnJW6-Mo101f0L_XKKExNXJGN7-A",
    "filename": "dsa_greedy_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10854367,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "12EQUMmyTMUp81-SKP9enYCxqGRLlOjT5",
    "filename": "dsa_greedy_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11018751,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1zWA1wcPh8X6HxBNDE4h0bQTJ-YlVuf0E",
    "filename": "dsa_fast-slow-pointers_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11618824,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1fvZyBzoSaLmP1c7iLJeSxeEKplIE0UOS",
    "filename": "dsa_fast-slow-pointers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11622671,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1v55pH7cRED5yFBKwBhHP1LP79OmcRE1b",
    "filename": "dsa_dynamic-programming-2d_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11380908,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1ECROiJ36i4KwGJzHasqG1Cf1bKj5Tsxv",
    "filename": "dsa_dynamic-programming-2d_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10731207,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1fBSGfVn0Gwmv46lQszCBUcnbQ07atqTg",
    "filename": "dsa_dynamic-programming-1d_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11602732,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "12t7axEsX1owRMnfsh1B27es_7tuKtbYf",
    "filename": "dsa_dynamic-programming-1d_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11042971,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1eniCMaa90V69W6eBhPXSRe_8XhzCouhP",
    "filename": "dsa_dfs_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10924961,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "14I_fdrB2dIjHki2DLLN54UAKXj8js9Tb",
    "filename": "dsa_dfs_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11312191,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1a6zZVeNcF90gaRYOChGbFPkUAHRZc05M",
    "filename": "dsa_bit-manipulation_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10993612,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1eX3HGKInn0hEV16_BA_-3aNctV4OTmmJ",
    "filename": "dsa_bit-manipulation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11091612,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1DP7D_wlwh9Q4_2LVPIm6a5kek8Sh5_Uz",
    "filename": "dsa_binary-search_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11342609,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1As8z7fHWTIqxmU6AZppAVXHGk38CUKCt",
    "filename": "dsa_binary-search_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11295684,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1pbt2C4QnMa3chYB34CtucDeCR3lXgOn_",
    "filename": "dsa_bfs_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 10866898,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1i-eUk3SgPjEQKz9JuwA6HvT5T7TC9QYM",
    "filename": "dsa_bfs_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10788530,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "14_aYxlMVAUjLTTtIo1AEiAlCSiNpIFRe",
    "filename": "dsa_backtracking_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 11090230,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1YGSsildl8gUiBcPUHdrczLxt4PQsFKrp",
    "filename": "dsa_backtracking_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11506356,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1b-Od4tn54SSeaPkeqHUy3ezdsX89Scl9",
    "filename": "behavioral_story-bank_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11059982,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1mYQxSNHBOO8d8YdfTwX-AJN3jPn1WwUK",
    "filename": "behavioral_star-method_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10949737,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1HOYEz-CFfnLBEL9wBti05MIiP-Shcuip",
    "filename": "behavioral_seniority-calibration_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11052841,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1FEcN3PbDl-Qj97algL63zqW35ldH4cNx",
    "filename": "behavioral_remote-collaboration_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11267148,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1eOtFzHZYL4kX7DgCNaMVVVoErBXYh9bz",
    "filename": "behavioral_project-deep-dive_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11001407,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "14zBKdPvFPBDrAn_W_5dnVexG3lSezmT6",
    "filename": "behavioral_ownership_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11297068,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1osK5zZYcl4AEWQa0vU2AbZLzIOIPVOSu",
    "filename": "behavioral_leadership-without-title_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10922042,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "14hR08kNh4g7RLZhHJusjcAOptHzxdTxX",
    "filename": "behavioral_interviewer-communication_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11116696,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1H_CgW-8oAqRpCdjtsIxTwTxIDSXNEF8R",
    "filename": "behavioral_influence-without-authority_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10909628,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1iifdmaWAKtu8VOaNcAOEIoNnlDmgkr_-",
    "filename": "behavioral_indian-context-for-us-interviewers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11286748,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "11NUE8Ms8DsF7svvAAlwEiG0mckDeySE1",
    "filename": "behavioral_impact-without-perfect-metrics_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10945981,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "12RKQ3_YQ_YaZX757d-GmvpO7E2HmW6b1",
    "filename": "behavioral_failure-answers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10851190,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1FE0AiacdFv5ID72BN-Xlv1JuiOiVWsUb",
    "filename": "behavioral_disagree-and-commit_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11244855,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1r0_MYN_m25TyLUx_Y_Mk0aAN5mNDxGO8",
    "filename": "behavioral_customer-focus_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10888975,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1tv0Wnt5M6FztL-S93Shq2VTPceBwO1lO",
    "filename": "behavioral_conflict-answers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 10909570,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "16F42vgojfF4CM3sYFE9AffAwu7LjDj0a",
    "filename": "behavioral_career-transitions_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11119322,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "1ZaGMOxFyJAx2jld6g6gumv1RmUwxxRNJ",
    "filename": "behavioral_candidate-questions_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11058946,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "15DNL3cAoxAlF7mzekxWYeQ8SoCmevebC",
    "filename": "behavioral_ambiguity_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 11380851,
    "collection": "Narrated explainers",
    "kind": "narrated"
  },
  {
    "id": "14jVm4h2FIHfaWw7Hnagjqm6F_wRjmuG_",
    "filename": "sysdesign_url-shortener_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 484590,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1tZ50xWz-mo66ox-XNS9Xd_5-qXykdET_",
    "filename": "sysdesign_thundering-herd_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 416624,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1p9Q3zir6z5jNz-dDvOG4vFHLgrFmOL0L",
    "filename": "sysdesign_sql-vs-nosql_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 413472,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1EWU1sgIHhVWUGCIt3tIzg5OVsq2vkDju",
    "filename": "sysdesign_service-discovery_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 410823,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1S3PkFMZ5vBVVHPI5_dwhfWoPdDFxgeME",
    "filename": "sysdesign_search-autocomplete_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 494660,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1yhGD5lY6jlntLw6ftvHMCUk6efpGV1cG",
    "filename": "sysdesign_ride-sharing-dispatch_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 492528,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1dm2PPVelPMFkPWscblqbfPriHFO9iRL5",
    "filename": "sysdesign_rate-limiting_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 420961,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1oQTUIS67T20NlJjwFVBQitEKLN20bv5x",
    "filename": "sysdesign_rate-limiter_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 486583,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1hVEIs96h9WM6eglobrVI51_L0ljWr2E9",
    "filename": "sysdesign_quorums_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 414823,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1pf4kgGZkT35g6yTB3sgXCXIdtcpnkoIA",
    "filename": "sysdesign_queue-semantics_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 397307,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1XIZeznoQVtVryfpC6qR2JAwzGDCZk4o3",
    "filename": "sysdesign_payment-system_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 491899,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1b265Tcp319b0EaF21i765Mzs_uJwI3v8",
    "filename": "sysdesign_observability_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 406246,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1nyLjmd8yyKDuoGNDArsFw4uZansaLIFs",
    "filename": "sysdesign_notification-system_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 497899,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1ugsavGNYx84axLSn8VP-4hHpSGIIS5Z5",
    "filename": "sysdesign_news-feed_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 485953,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1L2t-6CpeCacHcuCQI6Zk8TD8QwETmWto",
    "filename": "sysdesign_microservices-vs-monolith_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 429772,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "13mXMNGYVMBx18XME5z4vwc1oFW2-bmEJ",
    "filename": "sysdesign_multi-region_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 421139,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1EcCgoz-V1vYYbxTrEFpF132fulL66MCn",
    "filename": "sysdesign_message-queues_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 404742,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Xo2_Cra4NDJ2K2tFnHq9BbEmt6AGLli8",
    "filename": "sysdesign_load-balancing_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 417458,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1B81tYl0KWwnLYyyMBuW9UcXj3Y4O3HOF",
    "filename": "sysdesign_job-scheduler_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 486675,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Qmg-DnPiKqS1XubkT-2_PZVYF7s5phnm",
    "filename": "sysdesign_idempotency_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 416300,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1oJpUqAADPHxRsn1rECgeHxhJpq6WCPyt",
    "filename": "sysdesign_id-generation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 427899,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1DhC03zM2nUueVh0vtj_uyUa_UFbZraST",
    "filename": "sysdesign_hot-keys_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 417208,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1an8zGPook6DwGcjD3IOJxIC0gZJPOSGZ",
    "filename": "sysdesign_file-storage-service_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 495008,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1CyFgHFA9CqCw8jOrDjsu-1hvp3-tITL8",
    "filename": "sysdesign_fault-tolerance_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 410259,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1IdDnvdL0T7uHwuwt5UIc3OpkpnP0dGZL",
    "filename": "sysdesign_failure-analysis_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 415042,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1SdLh00ASHk0SZpBYoasrxQwXIh_xMUox",
    "filename": "sysdesign_eventual-consistency_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 421665,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1TreJJBFq3oNYM1StOHwfEf_309BwklSI",
    "filename": "sysdesign_distributed-transactions_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 426880,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "18clG15jgePcSl7kjgUh49cy4HbXoeDC8",
    "filename": "sysdesign_database-sharding_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 411917,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1dYbcBg8WAnSm0SDgKAfSjzBVPv9Y9Gr2",
    "filename": "sysdesign_database-replication_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 414971,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1u4ghmu_EpyD1ufWibuPQVSsUR0BvZonw",
    "filename": "sysdesign_database-indexing_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 419568,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1QI6eriomP4cqkNYWhw766pqPGTs3bMJj",
    "filename": "sysdesign_data-modeling_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 415543,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1DElxXQn5eLf422DpV0MKqbCjdkauM5dU",
    "filename": "sysdesign_consistent-hashing_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 421306,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1dVineVkImhP9atpUsO5DN4ceOfJmn031",
    "filename": "sysdesign_chat-system_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 492203,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1NM9KnGTytkPvsM7XJ7inqrpQCkj4adG-",
    "filename": "sysdesign_cdn_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 414438,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1iTVPRNcOfiunoYKpSvuw3N0ndY97M_bC",
    "filename": "sysdesign_capacity-estimation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 416454,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1BxFwAd4BO6iXkvESdt-HEvW-wPGFPJCQ",
    "filename": "sysdesign_cap-theorem_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 429795,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1_-KuiY-qrau2RiWSlI0i3mLrSh1Oq2mA",
    "filename": "sysdesign_caching_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 402413,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "10u012Nt1U9ImygPhXeBk_o52ddwR1TH5",
    "filename": "sysdesign_cache-invalidation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 413166,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1_YYU1Mlv1w8BWgc2NQO5FM4CY7xA1F2R",
    "filename": "sysdesign_backpressure_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 422445,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "17r7-o87_noIXAv04rga43joYM8WpRWJo",
    "filename": "remote_visa-myths_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 338306,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1gJX3pZO7qC66M0YolgDOgqapg-Ep4r9R",
    "filename": "sysdesign_api-gateway_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 406580,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1qLKU5-ijru8W23oa_4JX1EFHgx8evmIz",
    "filename": "remote_usd-payment-options_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 337992,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "10OIcCD_WUzqt9rUUfa3GlJ7vFnp--y6h",
    "filename": "remote_timezone-overlap_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 335495,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1eAfaw0oNXglCHirHlXzjAKaIMS3efgah",
    "filename": "remote_security-and-equipment_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 339835,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "18E_fidEn-1KEQJluday7KsfAu3sIog-m",
    "filename": "remote_remote-income-records_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 339488,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1DixzVuHvNrMwHTvcfXPwd4m9A1vqUMkB",
    "filename": "remote_payment-platform-comparison_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 339436,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1lqtYmZqPGIomvbCt9IzFSuDCozG-plsc",
    "filename": "remote_offer-scam-checks_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 338068,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1dbqzGSiAL3f9HXHnNtceWKElBWDw56Zf",
    "filename": "remote_india-tax-basics_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 338382,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Ez-kk3ot0FT7hIKoiWXlGDnVEomVKuke",
    "filename": "remote_eor-vs-contractor_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 337743,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Wd19iPMhY3sJHx-Sgj-6Fq7Ao4g8HOQQ",
    "filename": "remote_employee-vs-contractor_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 337963,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1VU7WXXY5bqJUHFaGZZkWvRR01AcCeawl",
    "filename": "remote_contract-red-flags_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 335752,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1o7GuJUwhe7Ct9AzBepdX5Nr5_8F1g7TS",
    "filename": "remote_comp-negotiation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 339261,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1vSD5ur9qkzlYEyvEXWf9pGcslxfmRpP7",
    "filename": "remote_comp-benchmarking_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 338753,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "12OlHx4WpUeBduDu2tCxheX0Yb3HazbIG",
    "filename": "remote_async-collaboration_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 337902,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1MJr1RAEaPippBx5-YhBjgiNumNbP0kko",
    "filename": "dsa_union-find_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 469827,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Clk2pn0sI2eRi2iTUxX3r8IY2H_lmuLQ",
    "filename": "dsa_union-find_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 388274,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "15wjifl4G8pS27ezEh3xa8HXblPOk2px5",
    "filename": "dsa_two-pointers_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 440832,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1ChtIJIUHEvsGBOlN5yCTnEbeWYnm-XWI",
    "filename": "dsa_two-pointers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 391632,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1WIdhxRNEpcU9H3X8WrQj8xHIvli8xWKN",
    "filename": "dsa_trie_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 435708,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1ngsRf3BqOsbg18QonImW4HNYtorr8uGl",
    "filename": "dsa_trie_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 386969,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1XVo5EE-94XOh87gTbvArgPKuGtHpM1JE",
    "filename": "dsa_topological-sort_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 446666,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1JW7pGaQnsqwXogO-gAx1YLwm-LmTVvzy",
    "filename": "dsa_topological-sort_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 367426,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1kn0t5LzHD6DyD0LYsjoTu9UAcFhKpHis",
    "filename": "dsa_sliding-window_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 453819,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1geT6YOUY-f9ouVt5dgZN7bxi9MKTEiVk",
    "filename": "dsa_sliding-window_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 402605,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1gV7CH6VLOpkP6f5y_GCAMRYrypDenUZD",
    "filename": "dsa_shortest-path_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 446264,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1nqrUpMXe-Ri87b_3rHakssvzAfxoRzuP",
    "filename": "dsa_shortest-path_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 394012,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1HruGW_TcOGClRin7IhtB6UdhaYgxj2mF",
    "filename": "dsa_prefix-sum_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 439370,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1qC0u6B2l68TJJKTtXDY1rn2Pa9OWQOzD",
    "filename": "dsa_prefix-sum_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 422763,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1nMiNvpoJMUKFZO2STC1S_Kzgy0xZArfE",
    "filename": "dsa_monotonic-stack_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 460418,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "10h2yMhlWYeHXp1TiApyX6N3lxmMDhXiT",
    "filename": "dsa_monotonic-stack_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 380712,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1arn9cg9S1wSzM06ZCv_IPdpry9dl5JEP",
    "filename": "dsa_intervals_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 450634,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1qy0XyFaIpjJwedzoITjm0i3UwUu1graI",
    "filename": "dsa_intervals_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 398725,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1AaemmlILg810SKM7mGKFaGYkK9_F-bQz",
    "filename": "dsa_heap-priority-queue_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 438929,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1-MegD5OCOhISK61NeIlhhZluiiGaA1D2",
    "filename": "dsa_heap-priority-queue_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 416046,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1jNIpiWtHVkmNcQEICaAqj_2sFtcA0CrT",
    "filename": "dsa_hash-maps_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 449189,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1fhSVi8vFHb3ZCbIn8bZTH2uoafYu-W61",
    "filename": "dsa_hash-maps_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 397669,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1qOm3SPgk565xK3xzrH3z2VE2Vo_Z_hcp",
    "filename": "dsa_greedy_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 444230,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1iZokNKZnPuaniQCERyVjGLvqZuUxsCEI",
    "filename": "dsa_greedy_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 391619,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1pnTxbNm_78ZcVBYGK0NHYcMRHRC-6PHe",
    "filename": "dsa_fast-slow-pointers_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 448150,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1zbHAhDlXACaS8PwMWmaWf-LnuNarZYD3",
    "filename": "dsa_fast-slow-pointers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 395108,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1T_k3uazAR2g4YzOz9HIn2-GPdikApbXZ",
    "filename": "dsa_dynamic-programming-2d_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 455321,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1_GjU36-Lb0Lbmtt0o0vKbS-wIANqrIr3",
    "filename": "dsa_dynamic-programming-2d_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 403335,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1ZHH5NWXJ7IZd3sxoykXO3w2AyVAXoRIk",
    "filename": "dsa_dynamic-programming-1d_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 466481,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1NHqWdmepo0dt2aZmuKhzkmv6loZ4_a55",
    "filename": "dsa_dynamic-programming-1d_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 386998,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "19eFBGFokdNPJM0Wmo9boSfofZNjByjpZ",
    "filename": "dsa_dfs_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 433573,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Z_ZMIpdVr6qer7FAC-XEf7Qh5hWTfm-K",
    "filename": "dsa_dfs_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 380085,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1zGrKKCXmugoSjacd67fhqHB32cgTPuYK",
    "filename": "dsa_bit-manipulation_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 405493,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1TjrxIOvW540-URO7eAAem1WjALLw8Q8R",
    "filename": "dsa_bit-manipulation_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 424889,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1--Sm2MYDwohfrfE6WQHHGoI3zUpyiRZa",
    "filename": "dsa_binary-search_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 440778,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1auqKmOlqOFpzo3MDJvZp3YYsC3U20gZ5",
    "filename": "dsa_binary-search_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 388995,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1-BZ4q-KQKiKpzKFf7QxzvLhFyIFyUaFH",
    "filename": "dsa_bfs_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 445260,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1HRsVNcYznBFByyH7VtbVWzP-dmykAYHx",
    "filename": "dsa_bfs_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 389699,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1-DIGsL2Bb7Nir2lXA_-JVMDg_1QjQooE",
    "filename": "dsa_backtracking_02.mp4",
    "mimeType": "video/mp4",
    "bytes": 467539,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1CfbdfBjeTlN7w-rLogeRSRpvp-Or5MVB",
    "filename": "dsa_backtracking_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 392373,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1H4x7_cmMtH8rO4iJkE92t1MNlmfTQP6u",
    "filename": "behavioral_story-bank_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 326889,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1LWfhlhZgsfmIUrDmycVJa8TU3rbWgoE8",
    "filename": "behavioral_star-method_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 327596,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1i9OoVPw2hLLBDPkC7udMonK5wLkbDQRz",
    "filename": "behavioral_seniority-calibration_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 330957,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1jfMtDj2qOu1hMbEGZQ9yxS1dvtf7VpFK",
    "filename": "behavioral_remote-collaboration_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 330935,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1pxOh-EbWoXzwRdTq5uzG-boRPTHnR-uo",
    "filename": "behavioral_project-deep-dive_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 328245,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Ztdg5JCdUVkPt-a01lT1TlpO5o62Dryb",
    "filename": "behavioral_ownership_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 325761,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1pDIIDUjCoDxmsr84zJTVXVLbwHauixoE",
    "filename": "behavioral_leadership-without-title_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 330795,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1m14ApJVppYtiw0F5zwHv_iks6RWUyz0d",
    "filename": "behavioral_interviewer-communication_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 328475,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1fG4245T84NmZ9eG6qXuDliAy-Oxae69T",
    "filename": "behavioral_influence-without-authority_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 330011,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Bh-6U2IN8-pJs5KstixM1GkTo-ia31zr",
    "filename": "behavioral_indian-context-for-us-interviewers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 332241,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1RU7iCC3QhXthVZtfB4mJWAgYdw6HBuTJ",
    "filename": "behavioral_impact-without-perfect-metrics_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 331305,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1cFPYDilDWlg-skX5x5hH4EjdzDNWN2PS",
    "filename": "behavioral_failure-answers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 329358,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1q_7DAztSaP_8CqGORICoXVXlCuMGp7Ld",
    "filename": "behavioral_disagree-and-commit_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 330185,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1Y-DpPbLZVUoI51UTMReYfws3atHQcmoI",
    "filename": "behavioral_customer-focus_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 331705,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1tuDrhcSMWDq6iNTnaFwm4JJaOk6yLQeY",
    "filename": "behavioral_conflict-answers_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 327683,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1oqlehBgSpEj1mDByainG-zFfUVBxo8CN",
    "filename": "behavioral_career-transitions_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 329458,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "11R5GLGfnNQsB3iWknphMDeFarJ_rkS0p",
    "filename": "behavioral_candidate-questions_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 329692,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1QOlqL8Tzr_TgaDt_zxYu33SD9Ig68UfZ",
    "filename": "behavioral_ambiguity_01.mp4",
    "mimeType": "video/mp4",
    "bytes": 327855,
    "collection": "Silent explainers",
    "kind": "silent"
  },
  {
    "id": "1LLeCXzl7buzw_vWgFpXYjIwHQY2duuqG",
    "filename": "sysdesign_url-shortener_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5706,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1uylgDLGNwnIkDfd1QZVTCzhU013ivzon",
    "filename": "sysdesign_thundering-herd_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5728,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1_waM4uRk24iDOsGG2FYW2uTs_mRJcWoI",
    "filename": "sysdesign_sql-vs-nosql_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5749,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1i-ou4rf-UG-I7u4uIBY5zEzeyfVD-jVi",
    "filename": "sysdesign_service-discovery_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5720,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Sx6neMImHn7LmoeSh7EafX3_vlNUuDda",
    "filename": "sysdesign_search-autocomplete_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5731,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1LAXcFWc5Yoct6v4XfovleK1dUnQtYk53",
    "filename": "sysdesign_ride-sharing-dispatch_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5731,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1IH1Q5EiUMfkgk0PW2CEF4oPVVKP7bCBf",
    "filename": "sysdesign_rate-limiting_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5752,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1jldFuIiefRN3aAzoxAPJdEAc41GzNwFP",
    "filename": "sysdesign_rate-limiter_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5713,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1znwpjiL3qiwBivV_7vJIpjEmpZKuneGm",
    "filename": "sysdesign_quorums_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5723,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1gDCQTQJQwesJ492rhLyIwHuQSSerrdLP",
    "filename": "sysdesign_queue-semantics_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5741,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1DROTfCVqX2bvIdzE1h63oBCzvJw-bRBk",
    "filename": "sysdesign_payment-system_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5746,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1B8fJplNsnBWPi3lCLQkeY5JiSYLXNQyw",
    "filename": "sysdesign_observability_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5754,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1QKpZe-e6nOPOREZgSnd2hMQiaZHN5FOD",
    "filename": "sysdesign_notification-system_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5758,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1QzC_igk2x8eTTZi_whJ2oWkJHf9OCRbp",
    "filename": "sysdesign_news-feed_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5704,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1DULjPTfXv3G64ikjjDc4Wt2V8-HkFnow",
    "filename": "sysdesign_multi-region_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5743,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1yCNyC1Ki2kNe0WPYR7nhmJZbeSTXm6ob",
    "filename": "sysdesign_microservices-vs-monolith_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5799,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1R_9qZVvZ6ARQPX0cAGVrQ13YqHnVO_lC",
    "filename": "sysdesign_message-queues_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5749,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Gb_1jvGObNLkk--7Mx4l2b0dh-AQyHPF",
    "filename": "sysdesign_load-balancing_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5754,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1VPBkDjPWKlEYkZY39qZYp0SXxr-CrpqX",
    "filename": "sysdesign_job-scheduler_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5716,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1vYmaXuVQcmB-8F81V1AHt0ovmRiknTxV",
    "filename": "sysdesign_failure-analysis_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5748,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1yLOXJfkG10WWKCu1PGLCQI4CUE3GQJLl",
    "filename": "sysdesign_idempotency_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5718,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1S4cenMztc5uYKfAuQ2wdO3rGMIqJmwvT",
    "filename": "sysdesign_eventual-consistency_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5775,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1JRQNQzHyxwmcAQ-Lbg-tXZ3QWpT1wDFL",
    "filename": "sysdesign_id-generation_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5790,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "16lKGBaRxTpFgfXZXNyilgHD4dJkx4oF_",
    "filename": "sysdesign_distributed-transactions_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5767,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1GAF4_ywkZEo0-U2sknpzhNc87PIEgCyy",
    "filename": "sysdesign_hot-keys_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5720,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1bBwIiABhE-I5-X0NJ_hF0TOAbFFRLRiG",
    "filename": "sysdesign_database-sharding_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5724,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "12r0gXrymdfjSaD2-4MS7nCzyt6BU_cBX",
    "filename": "sysdesign_file-storage-service_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5741,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1iYJDpAVkN8k-U64of5e0tiq-JLLdjmFe",
    "filename": "sysdesign_database-replication_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5753,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1nW6bz8zufmu0sRKTXOvol_GKKTftVrtY",
    "filename": "sysdesign_fault-tolerance_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5758,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1DtSO7KKvWipDPaB0aHI6oLAYMsz7Xwy4",
    "filename": "sysdesign_database-indexing_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5758,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1ViotGmAVW8EbCAlSYnBOu66qD0vceF6E",
    "filename": "sysdesign_data-modeling_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5745,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1108GqYxLZ-ODKnz8Z15ViYDjh76QEmWs",
    "filename": "sysdesign_consistent-hashing_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5744,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1vmhUuFloBLNllogX07W9OTmW2UnjtjQ9",
    "filename": "sysdesign_chat-system_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5717,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1BOlFL75htJJPhK-Mf3qAxsZA461dZYx-",
    "filename": "sysdesign_cdn_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5781,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Cg2TwNhAua8U6ZZCH9gEtcdSg5YOBxa4",
    "filename": "sysdesign_capacity-estimation_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5747,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1AKk2oD9cZruICDDRAspZ1l6wy8B-quPU",
    "filename": "sysdesign_cap-theorem_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5805,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1OgnAB0ROa7lJt6XwzAcJmz8Dan8r3yKm",
    "filename": "sysdesign_caching_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5735,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1viPfKLHjAgj1_-gcM0w-SzvGjJtWLInj",
    "filename": "sysdesign_cache-invalidation_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5721,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "16OVEgtOkVAdaqr4ei40UGnl36wMkW5IA",
    "filename": "sysdesign_backpressure_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5750,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "16ea3ff7uw3HG3mKAu29cbmyyT6kpeES1",
    "filename": "sysdesign_api-gateway_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5739,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1zuHunDBQYyvFQmoUNUbas2gC5MwCt4B2",
    "filename": "remote_visa-myths_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6043,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1-9m8FZVdmxP4CYRxweJfCL8qOnoCH2w5",
    "filename": "remote_usd-payment-options_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6029,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1gNmkAY-Ym4_jOJ2BFxcS4-8wn8HUI88n",
    "filename": "remote_timezone-overlap_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6021,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Uwf7DmOD5A5DBEL1Z-VZgvUHtgmh11Ko",
    "filename": "remote_security-and-equipment_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6045,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1dFwz1vXMyxxm7BYl67Qzzs7gTrHXbMO0",
    "filename": "remote_remote-income-records_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6045,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1DIj14pcXJ5nUorZ1qlvuwO7RMP2GaFkm",
    "filename": "remote_payment-platform-comparison_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6037,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1n6gH3ZnMcWrwkpdVjQkOrbSxrIx1288u",
    "filename": "remote_offer-scam-checks_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6025,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1VoV2C4lkg6LoqPXbhFWYDagqNOvVV0cm",
    "filename": "remote_india-tax-basics_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6037,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1HEV9K_UDE_krhSMQ6c_wXzSW8QmbMkIK",
    "filename": "remote_eor-vs-contractor_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6033,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1zNHUJhTmR6AsoRUW17mA6TQaWICUk_RG",
    "filename": "remote_employee-vs-contractor_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6027,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1BKEIhGZhvfCz5_lTte3DxilPlBtUHWmj",
    "filename": "dsa_union-find_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5378,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1lYbKC9EScI5O8JddAv4FmEq2xHKNoWhf",
    "filename": "remote_contract-red-flags_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6019,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1fkitNG2jwMHPKKFkAErv0CaL3zeOAbKo",
    "filename": "dsa_union-find_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5405,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "119npQ6GBf-2uQHDkEFghOPRBpqKOQph5",
    "filename": "remote_comp-negotiation_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6047,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1CuQqmuXiS27ptdK0lkl6WtG1EEr2rwfE",
    "filename": "dsa_two-pointers_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5414,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "193DuJ6nbVf21rk1b5BUZoUCautr2lTAA",
    "filename": "remote_comp-benchmarking_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6027,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1lJmxJSwIAiSOzrYWgUNBmt1g_h1rFj1Q",
    "filename": "dsa_two-pointers_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5441,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "171YDYnMmr40J77pQ2qzaWWQYD9Dl3gTQ",
    "filename": "remote_async-collaboration_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 6031,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1oUrw3AICv096pExAd4S1jlMngxvC9whi",
    "filename": "dsa_trie_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5368,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1HL1IuXnk78jLyynATsnBfHkHTarccX1f",
    "filename": "dsa_trie_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5395,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Xsd3SQecVRZnHr2rN211jFYNd0iVQEQ9",
    "filename": "dsa_topological-sort_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5276,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "15pq1I-AvIlzB1chvJrNCbX81n_YRRVFQ",
    "filename": "dsa_topological-sort_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5303,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1OpVpz_pO8cWa2lCdm4R-cSJOz0iLswlc",
    "filename": "dsa_sliding-window_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5490,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1sYvNYHtaukHf7icnxd6EL85IFASS7F5v",
    "filename": "dsa_sliding-window_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5517,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1neufOwXFBxrOLhrqzVn21khc1oT7zgfh",
    "filename": "dsa_shortest-path_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5423,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1oQeVkRIGwAqat8AEfC50sLe-ryAwFyvc",
    "filename": "dsa_shortest-path_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5450,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1hzuh_pVC1rsNexlhk6ERvrQ3GF1XS_bD",
    "filename": "dsa_prefix-sum_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5399,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1llom5L8vHMeVCF3oYbxUbPfr8v7jBryM",
    "filename": "dsa_prefix-sum_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5426,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1fLdvyWnhH9O0sppdxI9DLH3d2W8OpYIZ",
    "filename": "dsa_monotonic-stack_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5368,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1AETc0h_B5Uaxz3bFh9T7uRs1wc58Q60n",
    "filename": "dsa_monotonic-stack_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5395,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "12R_xcjMtrkMYElsonkLNwAgtt-AqQBs_",
    "filename": "dsa_intervals_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5457,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "16sY5kmjzeng1NLg10H6zIka8NX1rpWju",
    "filename": "dsa_intervals_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5484,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1uL4ELiZO65Ir4lJWm2wJXbTV9w2GTedj",
    "filename": "dsa_heap-priority-queue_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5396,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "10Ae1nFBSU42S_EQvnZouuucyEBr4U0ZJ",
    "filename": "dsa_heap-priority-queue_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5423,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1QAXiPEdL0httU5INPmujkH38bG7FIAkN",
    "filename": "dsa_hash-maps_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5428,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "17nCY2YUmoMWxDgaXgYdRw_W--2uQPZmv",
    "filename": "dsa_hash-maps_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5455,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1aCUH-q7Fcktwt07VV14UuCyrcprCjcJa",
    "filename": "dsa_greedy_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5432,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "18mXcfk2ZHa2jG2h9d6b6UpAK8giUxuwI",
    "filename": "dsa_greedy_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5459,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1e-qDA_RQWUTFfatMMsHMp4qdf0CVoMQ1",
    "filename": "dsa_fast-slow-pointers_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5461,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Z1LH9N3ZAp64Nk7jfDkDSZr1h2qgNaHd",
    "filename": "dsa_dynamic-programming-1d_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5439,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1V34FgKeq_m1jtRbERAKeqBPqUlPVJPKe",
    "filename": "dsa_fast-slow-pointers_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5488,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1rEUXHS57xD9CdqOf4sIf0X3zaKmSBCVS",
    "filename": "dsa_dfs_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5331,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "13wpeXFQLPek-VIpecjuCdWxwUkUcHNYK",
    "filename": "dsa_dynamic-programming-2d_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5478,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1iGrgNf-RX4z3BYp6Q0lW9vu-RovWZWNY",
    "filename": "dsa_dfs_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5358,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1GHoy61uxQ44rYSzt_9wFsLjfC3BSoClN",
    "filename": "dsa_dynamic-programming-2d_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5505,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Z75hkcLpDSia7n2mGNGK7cPpbhXiO-bq",
    "filename": "dsa_bit-manipulation_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5316,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1_oX75HxmcF7ksuXX1aqHrqInIu2ddy2F",
    "filename": "dsa_dynamic-programming-1d_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5412,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1fgA0ppeafGUj3rcCcpLxjWknhiX-3PaR",
    "filename": "dsa_bit-manipulation_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5343,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1GYlzEKpbScxLnFaCcDOTd1UjL8ux61fk",
    "filename": "dsa_binary-search_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5393,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Ob4gaNFjvGxN80GJr8lK2tm4k90jhZ4G",
    "filename": "dsa_binary-search_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5420,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "183CMBo-DXDou8Spdd9SmexUbeZPFbrQy",
    "filename": "dsa_bfs_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5370,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1t74FKK7VZMABgA1PWKQzCEbmZsFc73A_",
    "filename": "dsa_bfs_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5397,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1WXJdl3LlDoSeg30DIOVcT9hpF5-WkQE9",
    "filename": "dsa_backtracking_02_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5404,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1s9pGiQ16IxBYo6TquevVleYcOOtqmAVP",
    "filename": "dsa_backtracking_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5431,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1_FpqcJnC_-OaxKduDAmwTlU5wG5jB8bb",
    "filename": "behavioral_story-bank_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5448,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1x58fmqPE2KJU-8hkmJq9WrxLGPcL2NtC",
    "filename": "behavioral_star-method_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5455,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1geQnLuRYUt_k0IBZL4WMpuN69SNBegEX",
    "filename": "behavioral_seniority-calibration_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5475,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1P4lDpZ2o9VEz1mLtGYwOiFe1gRRVgHRu",
    "filename": "behavioral_remote-collaboration_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5484,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1LlqIUFiq7E_sRVzGgtiPKOGiWoxT8Gf7",
    "filename": "behavioral_project-deep-dive_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5467,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "12FkdEWc8RDd9QGSgz5YvygHwICv3XuB-",
    "filename": "behavioral_ownership_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5435,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "19uL7XAKvnoMOCJQDRR62_yMbX8TwwtHR",
    "filename": "behavioral_leadership-without-title_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5486,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1vZZw2m_wkgZiyNjdnSgzLgl-feVUptiW",
    "filename": "behavioral_interviewer-communication_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5463,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Ijc0DmkH_Jdukwcn6Nsy5mNAn70ExFzv",
    "filename": "behavioral_influence-without-authority_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5475,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1-OzibXl__WovajHOWUtxUqjtqyyRCKmb",
    "filename": "behavioral_indian-context-for-us-interviewers_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5494,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1VB2twBmJ6iTqdJI6msq9b0pPk1PvjZp1",
    "filename": "behavioral_impact-without-perfect-metrics_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5484,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1z2DZZGa6PrnQEOLQpEmhuePPdm67S6HM",
    "filename": "behavioral_failure-answers_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5465,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1Bqd6_kLTCALGHwYiKQBh4NgPCihCwiQe",
    "filename": "behavioral_disagree-and-commit_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5473,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1CDgVU0BFtrt-UUKxoHRLDU39_CxQ60PA",
    "filename": "behavioral_customer-focus_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5498,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1F694VIaAwvGEosiboRP4Ol-soUMBJmDF",
    "filename": "behavioral_conflict-answers_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5460,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1yfeI_0wVLmBRvPNSEX6x5uBGA5rDC0ZD",
    "filename": "behavioral_career-transitions_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5472,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1yOc6aon2nYAFoBa14lM5HuKM8wtVs-8g",
    "filename": "behavioral_candidate-questions_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5475,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "1PrVmC_vjit4U3kdEAwuGlodDLZEdRrCB",
    "filename": "behavioral_ambiguity_01_transcript.md",
    "mimeType": "text/markdown",
    "bytes": 5459,
    "collection": "Transcripts",
    "kind": "transcript"
  },
  {
    "id": "11beRFJxIkoNB9wq1r3RDTKu_i0yspMcZ",
    "filename": "sysdesign_url-shortener_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7053,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "18vP-g1ViHan7-EssLXeh_WRXFsjxYr4w",
    "filename": "sysdesign_thundering-herd_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7070,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "11yBl3UUbgO_FTTaOY3G3SwHjyjm9A8L_",
    "filename": "sysdesign_sql-vs-nosql_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7080,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "19q4icyWdOkG1fAHA0s5N3lZShbvPSiqP",
    "filename": "sysdesign_service-discovery_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7046,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1onAk9URX8rCNLPeAwzD3iSznTKS6d1wC",
    "filename": "sysdesign_search-autocomplete_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7072,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "11mG3NJjmcSsRVs3a-raZaiT4c0GzUAQ9",
    "filename": "sysdesign_ride-sharing-dispatch_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7070,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1bpak1EkXD8gvuVmEmKW-HBw17FzXp-Wp",
    "filename": "sysdesign_rate-limiting_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7082,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1iPqgmJQX6kv_KZmYUnVUyU4OXbowzmBb",
    "filename": "sysdesign_rate-limiter_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7061,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1d03ba87nrUFBKPCaJRlfONHPyoj2zyRw",
    "filename": "sysdesign_quorums_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7070,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1pxUL2vr2A1VDvUhS2MJeZDA2S6wt6mbK",
    "filename": "sysdesign_queue-semantics_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7086,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1bUvw9FS_kAxebI5ni5PiUv5MyZ76GYs0",
    "filename": "sysdesign_payment-system_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7092,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1MDa9cwfbPiRnX2KzFRQEJWCSnO4LX3gs",
    "filename": "sysdesign_observability_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7084,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1XrpeIa_PiJT3UZJ_msrX0fOFZ-vb6pvT",
    "filename": "sysdesign_notification-system_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7099,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1CytZ2g0mUvBdB4xHKDL78B2LwSwaKgyO",
    "filename": "sysdesign_news-feed_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7055,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1S3BcL2rLz0-vLBF9IF-D-TcHjtovc43r",
    "filename": "sysdesign_multi-region_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7087,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1c4Deua_QKCyeZY2u21V2pOf7bKggtA7x",
    "filename": "sysdesign_microservices-vs-monolith_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7117,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1OoKuBThUKBjCrFWQQP7NIMxLLAy5-mgU",
    "filename": "sysdesign_message-queues_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7078,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1fvNurQ1uKd_dTfYTAXFmXnslCkzzLIU8",
    "filename": "sysdesign_hot-keys_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7065,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1eYIADB8ud8aZl8tDX0BhaLPkYCevUPlC",
    "filename": "sysdesign_load-balancing_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7083,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1Ror7ysbS2X7peJFArJdxwmyUwcuEcBHk",
    "filename": "sysdesign_file-storage-service_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7081,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "16FOlY2xTQNh8iQynS4wVCG9pSAdHSDJS",
    "filename": "sysdesign_job-scheduler_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7051,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1TVdlKAwEJg5b0LrW0uabotVJE14W0IBQ",
    "filename": "sysdesign_fault-tolerance_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7086,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1648_rySsobZaforG_pF2WvX0fCi8_N34",
    "filename": "sysdesign_idempotency_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7059,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "19XODUDUzkrrJ2vrk5ERFeGBxXiI9zh6l",
    "filename": "sysdesign_failure-analysis_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7096,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1sfU3c6h5YOcXEwigItAokbdr6pqn9zZy",
    "filename": "sysdesign_id-generation_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7108,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1hBfjuFeH1v3PCUaz96pojTfiDGVzgvkX",
    "filename": "sysdesign_eventual-consistency_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7098,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "17WaB0qtUh-bUVzSUg68_R6VWVkKoPnKQ",
    "filename": "sysdesign_distributed-transactions_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7102,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1Zn-KQoSQb8QmwGPjBBp_p5F1CYD1cm_L",
    "filename": "sysdesign_database-sharding_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7050,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1pFHUrzFLNR8ejLWELPDYdwSNI0EL4RIT",
    "filename": "sysdesign_database-replication_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7076,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1GweZG2xxLZSYAprzU_081VdO_5D0DjKP",
    "filename": "sysdesign_database-indexing_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7084,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "13E20ULNMHY3-wBNS80GKPfqjJCKq7oY1",
    "filename": "sysdesign_data-modeling_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7085,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1wPvB4UKB6eKxYFeoDLzSNdqcY75fBFPV",
    "filename": "sysdesign_consistent-hashing_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7069,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1v6FZZcH35RehTbKPW_-SFfGTCei_nMvg",
    "filename": "sysdesign_chat-system_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7066,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1K2rGVovUDHnOeSljaV8k9lmI3z9zg9aF",
    "filename": "sysdesign_cdn_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7099,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1-CQaAdrqRa79ACJUo258bc0Eb8prTw6v",
    "filename": "sysdesign_capacity-estimation_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7082,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1dxinj4vJgnbsXh8L4864hyINYJy3hlVZ",
    "filename": "sysdesign_cap-theorem_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7137,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1QBlKEoWSuAzZGA7HAIcY3N5A_K5d7gzr",
    "filename": "sysdesign_caching_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7071,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1o9A-i7FBxnFo5yCIR0yX_fBwAzjx_ZxV",
    "filename": "sysdesign_cache-invalidation_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7061,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1RImi5n6AMVvw4bzmRu7FHg5l7ZWnSanb",
    "filename": "sysdesign_backpressure_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7089,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1sIcgy7_zFwkKMRYhh8kgSs7BT6pzPdGc",
    "filename": "sysdesign_api-gateway_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7071,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1T-SKOexw-glmzdBfWZpPDoj0BvVR64MD",
    "filename": "remote_visa-myths_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7290,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1OCfKuLrHMg30cVHoBL37trVVHdfF59hy",
    "filename": "remote_usd-payment-options_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7317,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1RSI-oflq_iGFzK6e-PY1mw2ORwClrtcf",
    "filename": "remote_offer-scam-checks_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7315,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1QK3h9TO4YMJu4LsAaLHPeEdOFOYX1-Ib",
    "filename": "remote_timezone-overlap_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7313,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1hMcKEYvLhbhPsvT3T9_uOwRI47jn1i81",
    "filename": "remote_india-tax-basics_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7287,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1ivJvtQqlvYKrppCZC4AKGlnGxjL-K9_U",
    "filename": "remote_security-and-equipment_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7325,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1CaCUzZuwvdlVT52WU_SqodFQVI43JDd8",
    "filename": "remote_eor-vs-contractor_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7319,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1PzX0KgwEecw5qARe2RTT4d__OLgYZnER",
    "filename": "remote_remote-income-records_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7325,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1E1jLpTzI17YQ9zgvtu6yM_YG6wiPiHZy",
    "filename": "remote_employee-vs-contractor_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7316,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "12E4duZPrkDipr0o95Xl4loTRiVzcumsH",
    "filename": "remote_payment-platform-comparison_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7321,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1-BOSST39dK3uSd4sLxwuuX2MoKAN82fF",
    "filename": "remote_contract-red-flags_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7312,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1m5GDDJfa9xDZVMSGFav-UoNU2SXVnVFp",
    "filename": "remote_comp-negotiation_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7292,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1uo_mBkjEVXLHWGa_OGY5HO5v4-8cfKPL",
    "filename": "remote_comp-benchmarking_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7316,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1EG3e6ff0VDO_HPH9aYhpjVBg-CrQmmXu",
    "filename": "remote_async-collaboration_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 7318,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1M_3Wei9voIkwDCAnGnIwcZmtYQwKFF3v",
    "filename": "dsa_union-find_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6774,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1veYBgDdVePVP3Q9Sw0mfOKPPq-_6G7VV",
    "filename": "dsa_union-find_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6783,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1txnSKACrA529fncFONqk79zh3yFFoURq",
    "filename": "dsa_two-pointers_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6808,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1y19AOr95CAOLMO4Iv0NewY9iLzVX23fM",
    "filename": "dsa_two-pointers_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6817,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1_CqHw92osCKyafMvsIGVnvmElMCbQ3vy",
    "filename": "dsa_trie_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6770,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1AguwDGXhBpVyN73zQG8b8HRh_3jaGUiC",
    "filename": "dsa_trie_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6779,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1ZgPC2ZU0NhSbGuX3FilQHen06d3uTHiy",
    "filename": "dsa_topological-sort_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6666,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1vOjyjcXnP5HvX9Me-FNBSTep1o0todgn",
    "filename": "dsa_topological-sort_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6675,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "15RGaPvMANB6Yv4lVaP3SJvyrBKX5UpDe",
    "filename": "dsa_sliding-window_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6882,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1g3OThoYsXXgEJq6ReOh_S5CGdPbXwt8S",
    "filename": "dsa_sliding-window_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6891,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1msWBL2fUvhRfuJ3uP3mn185vDBwIhxlV",
    "filename": "dsa_shortest-path_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6810,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "17W-scu6FZlMbdkEAEe5n-f1tzyXDTm9A",
    "filename": "dsa_shortest-path_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6819,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "13J29HaPhnW8eFLR7WV57IyDRU66eUsjj",
    "filename": "dsa_prefix-sum_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6795,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1c19GOZjnoR8dg0fgAoujjoLZ9OaibUjI",
    "filename": "dsa_prefix-sum_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6804,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1DUagDC3_tT1sWvmfjARoqcHoD-OMY6m_",
    "filename": "dsa_monotonic-stack_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6759,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1Y4rf6LCFYuYicRZuuHohhNC004lD44_j",
    "filename": "dsa_monotonic-stack_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6768,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "185xsP4tEAfiuoCEPCRr2kK8enhDZ9rOR",
    "filename": "dsa_intervals_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6854,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "18P91upTG2aYNUU4_0UIKeF4btlmqyoem",
    "filename": "dsa_hash-maps_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6821,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1G40bkPfws2NQrG7f7Aqc7zxSBLUGtF-f",
    "filename": "dsa_intervals_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6863,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1pYZZEfyTtqzZMcoKbFBSTVXIkqfN_r18",
    "filename": "dsa_greedy_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6832,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1jV_bOeRiRvq9SAI3VwNXut9OXAOb65qv",
    "filename": "dsa_heap-priority-queue_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6779,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1peiBvaX0U-XsX3g7cQUYKM9cSAO_ueVw",
    "filename": "dsa_greedy_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6841,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1ZnW4-Jl1H3oo2MIyKBanx1O2QgFGmivG",
    "filename": "dsa_heap-priority-queue_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6788,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1tK3OiIG-4bw_jvIrp6q-lw9hDeehGSJl",
    "filename": "dsa_fast-slow-pointers_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6845,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "13ngZnYZiUNy_Bo7N-qTImDXwrvwB1fSz",
    "filename": "dsa_hash-maps_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6812,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1T5QvOdq_ZqFb0parofEh5PHIQ4tZLqhc",
    "filename": "dsa_fast-slow-pointers_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6854,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1TB3q0WMhBSgu7gAg_3bfALkrxRYMSReb",
    "filename": "dsa_dynamic-programming-2d_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6862,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1Sod8ZMKIAn3Dglfpo7m1XEA6bPMadXOH",
    "filename": "dsa_dynamic-programming-2d_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6871,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1AtOHy7af3Lm3HllXPjkaDN3AddMu870h",
    "filename": "dsa_dynamic-programming-1d_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6796,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1ld70t6VWljRhW6qR5MrJtgC3su7jBq3h",
    "filename": "dsa_dynamic-programming-1d_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6805,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1JdbuEB7WUwQAAwsnET_CqtPw813VRZcu",
    "filename": "dsa_dfs_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6719,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1dX29_BQ1xthKAp4oZcnzAsoz5xB9-Slj",
    "filename": "dsa_dfs_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6728,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1Js1bq5ukTnMej_vNp5wnH2t6ZiOKG_nj",
    "filename": "dsa_bit-manipulation_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6706,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1ZC21Fmihlw72B9ywi174XHylrDSNywTN",
    "filename": "dsa_bit-manipulation_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6715,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1l4Dx5lLbg8QskvCmi9qAl33Y0VwUYlsH",
    "filename": "dsa_binary-search_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6777,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1s-WSwprxMNzM0OD7d9EuEyCbx4tBarnG",
    "filename": "dsa_binary-search_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6786,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1u78Lo3ju5BtP-4jNc5OPpASxHAerupff",
    "filename": "dsa_bfs_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6756,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1huYcrF4b1j2x51H_EK8KTulPUZ0f8ZrC",
    "filename": "dsa_bfs_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6765,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "15lx6nl4OgTH8FbiE1H7XOTYOx_wA9ER7",
    "filename": "dsa_backtracking_02.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6798,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1i9AmBwb7Cxo0quJ-jNE9QFjdB48TNo-Z",
    "filename": "dsa_backtracking_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6807,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1DvzLq9bmVUHAR9CzK7SWe8qj7t0w6H9V",
    "filename": "behavioral_story-bank_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6718,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1mg4RCifeiXAFGE_oEkUuJjDnGaWLg_TD",
    "filename": "behavioral_star-method_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6722,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1Pwb8E1ZwTW4p4GK7Un_LymoWLSaxyEds",
    "filename": "behavioral_seniority-calibration_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6737,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1P9-1hS-HzQ3oZdg4W__eJr9YW2T-AKz_",
    "filename": "behavioral_remote-collaboration_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6741,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1xzHXEgewtzg_-ecj9LNukaTQWOZt2kDL",
    "filename": "behavioral_influence-without-authority_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6740,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1iq5ZVb6jVVu8vcOTZGqpseGAcx4BHgW7",
    "filename": "behavioral_project-deep-dive_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6731,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1LEtn2oZVFEbR3_s0uZAgpHF68bguv-Dk",
    "filename": "behavioral_indian-context-for-us-interviewers_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6753,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1uQv7KQaDGTWZZpusBFevebGxh5u2dJOP",
    "filename": "behavioral_ownership_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6711,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "191u0QLxQr4PzXLcCVKWV7W62vjurro8T",
    "filename": "behavioral_impact-without-perfect-metrics_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6746,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1ByNqhBktlkdsZ5CWmFm4LEwVR0Zj6IN-",
    "filename": "behavioral_leadership-without-title_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6744,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1F74aR_UAODZulf6mIXsk-T0GB_aH3_e8",
    "filename": "behavioral_failure-answers_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6729,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1WZbAY2U3sl9sg8WaxGfEHQW3UMPo1esT",
    "filename": "behavioral_interviewer-communication_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6733,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1u2nsaCCJbHcRSyaQ5-cC4isjIVL3L83D",
    "filename": "behavioral_disagree-and-commit_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6735,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "19TpRkB_9eJiuPJ4PB5ocbUqj8kX4yhon",
    "filename": "behavioral_customer-focus_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6745,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1OvRS7y0bYmfRj330pk-brMZIcRTaTuNm",
    "filename": "behavioral_conflict-answers_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6727,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1UmEH18vQdePHeZfxcV_nRl1cWL0tK0eF",
    "filename": "behavioral_career-transitions_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6734,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1XugGLKTZxHookIJYbbek9fWIgAS_JgwC",
    "filename": "behavioral_candidate-questions_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6736,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1elcfJgUj_dEmiD3n2dQgOeEp9n4OcQ5U",
    "filename": "behavioral_ambiguity_01.srt",
    "mimeType": "application/x-subrip",
    "bytes": 6689,
    "collection": "Captions",
    "kind": "caption"
  },
  {
    "id": "1tfuxST0q-Lu23JPmYM_012hrDooNOJnQ",
    "filename": "sysdesign_url-shortener_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1829,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1YZbUhbCiKF_hbQZ2rR0bjIlB8q-ZIL47",
    "filename": "sysdesign_thundering-herd_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1832,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1opXAzKPX2o_74_0J9JFw0In_jHmjxWm2",
    "filename": "sysdesign_sql-vs-nosql_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1843,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1XI5voTLmdaXaRA1yNX7WWfNL8XPEGlYe",
    "filename": "sysdesign_service-discovery_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1814,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1R1fGIN-n5dMkx0qVYJHnZkKq3efbUxQK",
    "filename": "sysdesign_search-autocomplete_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1856,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "14pB8y-2chYdXeytrp2JdnG4K9RAXsdZG",
    "filename": "sysdesign_ride-sharing-dispatch_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1870,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1QQD9CEXiue1TaxLE8UN_4XUCQ5y4mZzy",
    "filename": "sysdesign_rate-limiting_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1848,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1_OYzBFUfnNCiAhv5lpyJwCGdk-Ztlo65",
    "filename": "sysdesign_rate-limiter_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1834,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1o9b_t3BR4iOHfTmqX0sZoefwv5TQIlym",
    "filename": "sysdesign_quorums_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1788,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "18Zflv7Ln5Yzs8lGHfmEDKA4bVgG2dVMB",
    "filename": "sysdesign_queue-semantics_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1858,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1ahbNiiom-DJD_m4lvaCBkoX3WvrRFOJd",
    "filename": "sysdesign_payment-system_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1881,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1AYWqA8aUiKHI1kdAOwirRWMYhWT3Oqai",
    "filename": "sysdesign_observability_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1870,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1VLQSBYso_4HBk6Yhi9myp4Q-GGv2Kp-W",
    "filename": "sysdesign_load-balancing_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1852,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1Kxk2faM0fTtwD6EbZfS-a-gXUjXx5Sz4",
    "filename": "sysdesign_notification-system_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1893,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1LSYISwqNwS6Ww8xiUGuXE9qKrLFqQ4Xv",
    "filename": "sysdesign_job-scheduler_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1827,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1IywQE2FaJSwXwsxA7JkYUFYylhXHgLBl",
    "filename": "sysdesign_news-feed_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1809,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1S_xprNAkrY_loS1hGmx7B24j9VKjqwoo",
    "filename": "sysdesign_idempotency_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1819,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "11Tr2B6YAGPpuQNVdUFiYTW7BXSEBsgNh",
    "filename": "sysdesign_multi-region_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1850,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1Lt1nTt0S93wtHSEY3z5R3_AkY9rMFvVF",
    "filename": "sysdesign_id-generation_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1874,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1sBdC1z-_J0nL3TK9pt_0ee1GmKF5hx0G",
    "filename": "sysdesign_microservices-vs-monolith_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1919,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "17AJ_YbeKiKiTZmUekfb7HNcObRMLWhaJ",
    "filename": "sysdesign_hot-keys_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1806,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1XQNMTGyH_6uR5i-oVIttmV4_fRH4JA7N",
    "filename": "sysdesign_message-queues_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1867,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1RccrAy-22DuuqFCR9POnEHTEOdemvvTG",
    "filename": "sysdesign_file-storage-service_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1888,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1UGDnVkEwG3L0wkL4nyYXSOBRCYK-GBiy",
    "filename": "sysdesign_fault-tolerance_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1868,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1tni0wswdV3VU2veMz13xVD7m3_5h6WV3",
    "filename": "sysdesign_failure-analysis_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1881,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1djyR5c_IoarmzMhwfAUi3x_CEs-X0vJD",
    "filename": "sysdesign_eventual-consistency_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1875,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1bVIWb6TteADglR61gI61TSHsOmI60F6j",
    "filename": "sysdesign_distributed-transactions_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1901,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1qxr4NzHpi9WNZmx9-F95PVHxInih1Pqf",
    "filename": "sysdesign_database-sharding_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1828,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1dhfBJHsVm8BAq32w2F2bcbo4PO-aAIgN",
    "filename": "sysdesign_database-replication_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1853,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1A_qXgtg-z6fSYpXBbu_8P5hEiCaSV7y7",
    "filename": "sysdesign_database-indexing_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1862,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1OSeuh2mswnJwmtx_DmSSADUHq5SOBRCm",
    "filename": "sysdesign_data-modeling_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1851,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "15mlVWfHfvFUc8oiufBQD82Vs1vVnXxF6",
    "filename": "sysdesign_consistent-hashing_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1840,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1Es_QD5gXZ1LEF-U6b4ZDckrumjx-6Gqx",
    "filename": "sysdesign_chat-system_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1826,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1ijZLAca-CFK-XpcAMWmpy2xFk92E8zLS",
    "filename": "sysdesign_cdn_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1835,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1SIn5vfoIYCazfcgcMmb1b4Qu35oj9Kfi",
    "filename": "sysdesign_capacity-estimation_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1876,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1Rops6ha9unuO9EHe-SLM0Y95KpR_zbvm",
    "filename": "sysdesign_cap-theorem_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1857,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1q0WOWEtN5x7-smJNlVFus9ffUQxEAdYZ",
    "filename": "sysdesign_caching_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1839,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1vd1amZ3sPDzS7v0Xt_DPxM94M3wQMyb0",
    "filename": "sysdesign_cache-invalidation_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1842,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1rYMeoSOzTP8QYUnZY0_rL5ZEXCKV8azm",
    "filename": "sysdesign_backpressure_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1852,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "15rp0yBRUJQSqF6otkW7LTVPfwlNeamTo",
    "filename": "sysdesign_api-gateway_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1841,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1yiHep0dPCc6M552PH4xfLyHxCA5RZT3E",
    "filename": "remote_visa-myths_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1872,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1hnv3A_GV45b7EnLweo-wmTk31AYD3asF",
    "filename": "remote_usd-payment-options_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1901,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1JbyXGl8qqXkbGwa6y_GbfpB_4HgI3JhR",
    "filename": "remote_timezone-overlap_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1885,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1cY8kwKoV7LlISG_YVStXcDfQJnFngYw2",
    "filename": "remote_india-tax-basics_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1893,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1R8G8Psctz3e9DRDl5q9HlRBLhgMQ4FCp",
    "filename": "remote_security-and-equipment_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1921,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1BvbkUhjiY5b8n0-w_aP7AJ55HWAHFiXN",
    "filename": "remote_eor-vs-contractor_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1895,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "14gm438x9RGf14YT50LKZH5nZJYJ58krt",
    "filename": "remote_remote-income-records_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1917,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1iqKbLeoXzofTzr2YtCQwE225T-86sl8J",
    "filename": "remote_employee-vs-contractor_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1912,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1-LUzc8BtiKY53eBWsuP67iISnjC28_Ak",
    "filename": "remote_payment-platform-comparison_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1937,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1wCeriKBRTQAMQkKoOpaI5FenFEYwFtPi",
    "filename": "remote_contract-red-flags_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1892,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1jYrZF-ShYer9sOvnthNtdundi6hcHu2P",
    "filename": "remote_offer-scam-checks_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1891,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1Paql2VXzP2UbswXKMv7CU1_VIHY1R-Kg",
    "filename": "remote_comp-negotiation_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1898,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1gvqRFL5rDcO76TdjQorldY2mRjOT7JOZ",
    "filename": "remote_comp-benchmarking_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1892,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1iQyyIta1LruNrYndo057_WcgaJ2lvrXM",
    "filename": "remote_async-collaboration_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1902,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1llZVvjYl8_VtFKTK7hrccqnHA-UnoZc4",
    "filename": "dsa_union-find_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2212,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1YkM1wDF1TAqrEzn0MItoZ8UhTQ9hDR3m",
    "filename": "dsa_union-find_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2229,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1KU277l4oTRAfpWW1RF9FN5O1Wvd_Xq-O",
    "filename": "dsa_two-pointers_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2250,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1zFsEbnLlbT5cfUH-xaTbExp9o7JjeaEF",
    "filename": "dsa_two-pointers_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2267,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1LlArd8EBAgFF0hqswgidlgS3AM8JDmAS",
    "filename": "dsa_trie_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2196,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "12Hhq98194M7Ka_kO9neYcblLZ50Q9qKV",
    "filename": "dsa_trie_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2213,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1oWZv2f27nylAOHNZ1K7Kp8E9YR-IU2Mq",
    "filename": "dsa_topological-sort_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2116,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "19M11qBgyeC9wfEa6nNGQW9Zb1FjYeTWS",
    "filename": "dsa_topological-sort_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2133,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1X3fKNfYliJa0DhV_q7kMDIbTRhH9jQpZ",
    "filename": "dsa_sliding-window_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2338,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1sIeath0MCgL_duYeKiQh38DfTojAsAsO",
    "filename": "dsa_sliding-window_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2355,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1zXNZkls6uj0sYATM505F5ywAqr0gOKj3",
    "filename": "dsa_shortest-path_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2270,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1yUVkMGdkmmPtW5mQPWoNYeqWQsKqPEBc",
    "filename": "dsa_shortest-path_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2287,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1gCyLzwfbewuXPQ3_zH4WJbD3ok7P2y_T",
    "filename": "dsa_prefix-sum_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2233,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "10KHtdt2wunAoeaN6aF0dAWmA2GK5xl2f",
    "filename": "dsa_prefix-sum_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2250,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1HuYrOZ9Olv32WZ71-jqNM_z6xigrcXN7",
    "filename": "dsa_monotonic-stack_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2207,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1-_HapDMEiAYPBSNplEmaMrEHVr7QB5sa",
    "filename": "dsa_monotonic-stack_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2224,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "16vEa1swk4lXiQI2AVwpPMGRDgpw9jtfo",
    "filename": "dsa_intervals_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2300,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1mP5bKfj8qL1NVQCMvMY6FsJZvwChkuCB",
    "filename": "dsa_intervals_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2317,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1gPu3mP-lzQolSfcE1LzOJ3RW2OkfSoJ0",
    "filename": "dsa_greedy_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2289,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "17aUmGrw6ZyhnrUm-W7g6CHYQinWqGRVb",
    "filename": "dsa_heap-priority-queue_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2239,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1DZljpCZpvXCYVPZSuHOizKuhfnHwV1sW",
    "filename": "dsa_fast-slow-pointers_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2303,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "17YwxHLKAqiQV6-7fFesQ-3BNYSUZenKq",
    "filename": "dsa_heap-priority-queue_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2256,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1NDHOYAL4aN8R_e7_KODShZZtPf0jjZ98",
    "filename": "dsa_fast-slow-pointers_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2320,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1Ht1PvxSWtM7l6YmQqK_nDU70I0dG9Uxk",
    "filename": "dsa_hash-maps_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2261,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1doIKBS_dRzTzfIxaLH_Ub2NogTIzhl83",
    "filename": "dsa_dynamic-programming-2d_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2344,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1CHOcMiDoQqul825t68dsKr2kDL01w7AV",
    "filename": "dsa_hash-maps_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2278,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1beUkF7jk2Jyk-PjILVGUkccTw5D70Nji",
    "filename": "dsa_dynamic-programming-2d_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2361,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "19QznslsJKdOk-qyW7ZnF69g3TbN9SEbf",
    "filename": "dsa_greedy_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2272,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1-ItMbpZ4pgomj2k9L558EjEI-KTvlbBT",
    "filename": "dsa_dynamic-programming-1d_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2268,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1dKoxFKUTHNLS1EeJDDiQzTyLs_CZZ-pI",
    "filename": "dsa_dynamic-programming-1d_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2285,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1G3fy1mAWm_oGJsRu6yLcPUmpzYZNkVSX",
    "filename": "dsa_dfs_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2158,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1tEG3qqnqZXsYKf6JVHu7Wf6OIHiNyk9r",
    "filename": "dsa_dfs_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2175,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1n_0fOKNX-RDkC0nSWPnp_Xn1yfIv0DC4",
    "filename": "dsa_bit-manipulation_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2156,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1oNXR8ARq-ZYiEw8vM2x3_OnRc-Gv46Dy",
    "filename": "dsa_bit-manipulation_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2173,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1NU0WT6GyZNsFaGDLJPYJGutnfOneSCBI",
    "filename": "dsa_binary-search_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2230,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1XPMkIln_n31c_kOZhPxbQ4GVoklt8XZg",
    "filename": "dsa_binary-search_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2247,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1pyRPQSGt9Q15gdZvz7BrzzIMA7T-zGx6",
    "filename": "dsa_bfs_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2197,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1bApNFmQyQX6aYq2RoZNH6jDug5nMVa3s",
    "filename": "dsa_bfs_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2214,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1FBIBfg1ibkxEEH82IPAiIKccDBuWe-YH",
    "filename": "dsa_backtracking_02_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2260,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1nTO8ZI9IWgU7YV3ePPsWbSNRwUVjKk7P",
    "filename": "dsa_backtracking_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 2277,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1W3ZHpf-JZ_w_MMBvpqyLXO8_jHnO6JSG",
    "filename": "behavioral_story-bank_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1810,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1zjzu5L79-0oODAYHqwX8DXF_hZGBwGK8",
    "filename": "behavioral_star-method_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1817,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1WbPTZeQRVkuGPQGlAYbWwjTuGOgCt0MF",
    "filename": "behavioral_seniority-calibration_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1862,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1Wpni7YvhxTrytRt2J1u32XNJ957RAPIv",
    "filename": "behavioral_remote-collaboration_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1863,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1uO16vPpmk5s2_sPvg1eo2wiOv9fCfH82",
    "filename": "behavioral_project-deep-dive_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1844,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1_uyUMiLMt6JVkDq-dvyiO9OKWlBWL6A1",
    "filename": "behavioral_ownership_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1800,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1jNSRXeTr6_s6t2Y0FEgabUdspc_lQNAk",
    "filename": "behavioral_leadership-without-title_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1878,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "13lM6dVfdy8EyGgU1BrYpdV4We7vz7bBS",
    "filename": "behavioral_failure-answers_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1836,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "19hKbMJbwuoj3hPO8R4JVFP--jyvF1b9u",
    "filename": "behavioral_interviewer-communication_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1870,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1PA0sfk0HsIZyUz4yg0e6jVoM7liVZaHd",
    "filename": "behavioral_disagree-and-commit_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1854,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1I4kW0AG5N1__0tmgZqfbDdfx2NQgEd-T",
    "filename": "behavioral_influence-without-authority_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1883,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1yepAGua0o1kz6Xd6_oRq0X4qPlwdGW40",
    "filename": "behavioral_customer-focus_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1849,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1uRwAAbzL84ALxoMh7oX93bG_Evjb6abX",
    "filename": "behavioral_indian-context-for-us-interviewers_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1917,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1rCXDIZ6-MDgMNNv7kn5wLT-0beRNw_IA",
    "filename": "behavioral_conflict-answers_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1837,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1VCUNSYWBNb2D95dMgV8LOvvrGLKbPc1X",
    "filename": "behavioral_impact-without-perfect-metrics_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1898,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1LkQP3mMRkJXec6qH9ihX6m0mOtsy0Oz5",
    "filename": "behavioral_career-transitions_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1850,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "1SGnYhS2pP4ZTH374UorkPjRhkxL-IIj4",
    "filename": "behavioral_candidate-questions_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1855,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "14IFYu941DTp2PvWDp2oUocYhnl-SlUWs",
    "filename": "behavioral_ambiguity_01_storyboard.json",
    "mimeType": "application/json",
    "bytes": 1812,
    "collection": "Storyboards",
    "kind": "storyboard"
  },
  {
    "id": "15uXi6GmPVrtjs9hukpvLFuz-fOIPIrbb",
    "filename": "mock_sysdesign_webhook-delivery_03.m4a",
    "mimeType": "audio/mp4",
    "bytes": 33623558,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "14zQt4CMhGZByRorHnuP788QHIIc6u_nU",
    "filename": "mock_sysdesign_url-shortener_01.m4a",
    "mimeType": "audio/mp4",
    "bytes": 38461458,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1uEzjNqQgsLTE8TgFA0CH5JDDulrt1vGh",
    "filename": "mock_sysdesign_notification-platform_02.m4a",
    "mimeType": "audio/mp4",
    "bytes": 35113866,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "17hO6lkr5TUJOqalOScamTR4Af8zFehqQ",
    "filename": "mock_sysdesign_job-scheduler_05.m4a",
    "mimeType": "audio/mp4",
    "bytes": 41703546,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1BvAx1hJSFuPjdV3Zg38LNDbjWrvWK8Sz",
    "filename": "mock_sysdesign_file-storage_06.m4a",
    "mimeType": "audio/mp4",
    "bytes": 38680179,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1Y7ut1o4JVPl6p1UaJgChHrIBET8uFSkm",
    "filename": "mock_sysdesign_chat_04.m4a",
    "mimeType": "audio/mp4",
    "bytes": 30887845,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1tNbqjVQVSUITenIz404IVTTlZ3pAnBVf",
    "filename": "mock_recruiter_services-to-product_04.m4a",
    "mimeType": "audio/mp4",
    "bytes": 16600625,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1PzYYa-ur95KCaoptRrug2a4_egv_LoeQ",
    "filename": "mock_recruiter_remote-saas-backend_01.m4a",
    "mimeType": "audio/mp4",
    "bytes": 19011962,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1TpM0J3ONOvTvxM9HM2JxnuY_ySNxARuD",
    "filename": "mock_recruiter_platform-eor_03.m4a",
    "mimeType": "audio/mp4",
    "bytes": 20718033,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1UrNK-q4-OmIgZW_IciNlGCRnXF614qOo",
    "filename": "mock_recruiter_fullstack-contractor_06.m4a",
    "mimeType": "audio/mp4",
    "bytes": 18172799,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1wWKbgN_NPaw85EMbXj7c-stBMSOtSiiA",
    "filename": "mock_recruiter_frontend-growth_02.m4a",
    "mimeType": "audio/mp4",
    "bytes": 16452671,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1zyaBQKr-kpaB938w5rDbqE5v_UDAz0ED",
    "filename": "mock_manager_quality-mentoring_05.m4a",
    "mimeType": "audio/mp4",
    "bytes": 41829327,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1Y4cvGHB1xMdukwJgr3WRotSLqmnk0zKN",
    "filename": "mock_recruiter_data-short-tenure_05.m4a",
    "mimeType": "audio/mp4",
    "bytes": 17716730,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "15ssLfZWvFv4oblCHVihA-4eertYD1lZ2",
    "filename": "mock_manager_incident_02.m4a",
    "mimeType": "audio/mp4",
    "bytes": 34593415,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1YhO_xbQPKoDs83_c_MQEDuRl_yQMTPcL",
    "filename": "mock_manager_frontend-performance_04.m4a",
    "mimeType": "audio/mp4",
    "bytes": 29278381,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1qlKKdMU8Twy2wnAfN7KH6oIjoW7aKE1X",
    "filename": "mock_manager_backend-project_01.m4a",
    "mimeType": "audio/mp4",
    "bytes": 32899653,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1YJ4f9eI-mcfNvaR5iXhjMZwvCsutiVw4",
    "filename": "mock_manager_api-migration_03.m4a",
    "mimeType": "audio/mp4",
    "bytes": 33076522,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "18tjEBWQz58m6sNtSj0fPyK1lVhW7beqk",
    "filename": "mock_manager_async-execution_06.m4a",
    "mimeType": "audio/mp4",
    "bytes": 32284852,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "11sTyYAjgBeQOkH2sWD3a-bvucfkpkXxJ",
    "filename": "mock_coding_topological-sort_03.m4a",
    "mimeType": "audio/mp4",
    "bytes": 34485345,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1ZbDdxLlWdGiPp3C4Ckrk_muXigxCqTgl",
    "filename": "mock_coding_sliding-window_01.m4a",
    "mimeType": "audio/mp4",
    "bytes": 29411942,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1AfX0F8-1aVXplaP_QPF697oNgKLJKgDu",
    "filename": "mock_coding_intervals_02.m4a",
    "mimeType": "audio/mp4",
    "bytes": 24376357,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1pUv6XmGHvcUixsVSwQrsma8LwNxGZyUC",
    "filename": "mock_coding_heap-stream_04.m4a",
    "mimeType": "audio/mp4",
    "bytes": 34227495,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1YfpK8fZeUuS7ac40QZz64nlMzXlU56tk",
    "filename": "mock_coding_dynamic-programming_05.m4a",
    "mimeType": "audio/mp4",
    "bytes": 34275923,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1DHQfhAawsxF2sU7Uqt85Ud8cv_Z4EIA-",
    "filename": "mock_coding_bfs-debugging_06.m4a",
    "mimeType": "audio/mp4",
    "bytes": 29021908,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1AiTSkDWUARsyxXIac7woeditBjKjzsit",
    "filename": "mock_behavioral_remote-collaboration_06.m4a",
    "mimeType": "audio/mp4",
    "bytes": 24509587,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1ERTkcinSOK7WkW5dn8wyuxSGgZspR0nb",
    "filename": "mock_behavioral_ownership-failure_01.m4a",
    "mimeType": "audio/mp4",
    "bytes": 23524021,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1utfvrFWlT_gKapTQ5jdXLqdU4eDcPrPr",
    "filename": "mock_behavioral_influence_04.m4a",
    "mimeType": "audio/mp4",
    "bytes": 27812629,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1ErLwbHJYPEurtM1cCC-HtPOrhrH8hmc9",
    "filename": "mock_behavioral_customer-integrity_05.m4a",
    "mimeType": "audio/mp4",
    "bytes": 29234362,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1RUnqGc6UPSF9LcOeRCxIiMMPxHaQP2yB",
    "filename": "mock_behavioral_conflict_02.m4a",
    "mimeType": "audio/mp4",
    "bytes": 26963969,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "16DsMCUq5nedeAH2wiNRwaJswa7K4GNXw",
    "filename": "mock_behavioral_ambiguity_03.m4a",
    "mimeType": "audio/mp4",
    "bytes": 25069849,
    "collection": "Mock interview audio",
    "kind": "mock-audio"
  },
  {
    "id": "1YvY5fFHnvxiL1Mu2elyetzanaYwvXoJX",
    "filename": "mock_sysdesign_webhook-delivery_03.md",
    "mimeType": "text/markdown",
    "bytes": 32098,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1hrAQdUsLYuLHI-PJ2KTN8_vxWPIcqzJf",
    "filename": "mock_sysdesign_url-shortener_01.md",
    "mimeType": "text/markdown",
    "bytes": 32011,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1zJx0hZ0rUShLYIqsBNj5KlFfCHBFgidL",
    "filename": "mock_sysdesign_notification-platform_02.md",
    "mimeType": "text/markdown",
    "bytes": 33316,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1RkLLqL6Y5wfMz_GGYS6JPKAE7YAdzP3D",
    "filename": "mock_sysdesign_job-scheduler_05.md",
    "mimeType": "text/markdown",
    "bytes": 34848,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1yzAEbqLYXWId-I9kblZQ27BOEHqQA4sT",
    "filename": "mock_sysdesign_file-storage_06.md",
    "mimeType": "text/markdown",
    "bytes": 35166,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1NOXUE3acqMJ6mfpZQz9IBSq7cnOPqqwm",
    "filename": "mock_sysdesign_chat_04.md",
    "mimeType": "text/markdown",
    "bytes": 31801,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1aflgOW3LgdpqL0USuY2HgSggL31mo4WQ",
    "filename": "mock_recruiter_services-to-product_04.md",
    "mimeType": "text/markdown",
    "bytes": 18755,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "15fjkv31Jn40jrxWYJa2pOT6Q8fwQbb5B",
    "filename": "mock_recruiter_remote-saas-backend_01.md",
    "mimeType": "text/markdown",
    "bytes": 18284,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1TItst1yOzuXPBO6YQKTqJMy8nFxpkC0o",
    "filename": "mock_recruiter_platform-eor_03.md",
    "mimeType": "text/markdown",
    "bytes": 19412,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1MN0U-jX6fMS_3ZdnJTpB4axar0RFVDuw",
    "filename": "mock_recruiter_fullstack-contractor_06.md",
    "mimeType": "text/markdown",
    "bytes": 19772,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1hfPRjLV31Qch_wR67XdDfFW9S3QD2XoO",
    "filename": "mock_recruiter_frontend-growth_02.md",
    "mimeType": "text/markdown",
    "bytes": 17448,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1VHncvGL-KgDLKmwzUCwme0uZe5s10UgB",
    "filename": "mock_recruiter_data-short-tenure_05.md",
    "mimeType": "text/markdown",
    "bytes": 18197,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "176qxQw_cDdyvFEmihheXzJBgkQMjLPJS",
    "filename": "mock_manager_quality-mentoring_05.md",
    "mimeType": "text/markdown",
    "bytes": 34268,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1uzCcvBkTqMaZL0X4F0XHnKvDXPm0DV8h",
    "filename": "mock_coding_topological-sort_03.md",
    "mimeType": "text/markdown",
    "bytes": 27992,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1rmPgbTfwnscsi6c4YlOVd5_BW-b3HcO2",
    "filename": "mock_manager_incident_02.md",
    "mimeType": "text/markdown",
    "bytes": 34355,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1n4eBf1nNNFqg5pRQOAQDnTfIeeu1XRr8",
    "filename": "mock_coding_sliding-window_01.md",
    "mimeType": "text/markdown",
    "bytes": 25758,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1EY5dLuOv2U7ueBYcXxUhErGyXMu27FJx",
    "filename": "mock_manager_frontend-performance_04.md",
    "mimeType": "text/markdown",
    "bytes": 29464,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1TX1csiGaiz4AluWFiuZsgVTf0keAFX72",
    "filename": "mock_coding_intervals_02.md",
    "mimeType": "text/markdown",
    "bytes": 24359,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1Aho7XAC8-oKHU5n4eythSNO-OMbKeWt0",
    "filename": "mock_manager_backend-project_01.md",
    "mimeType": "text/markdown",
    "bytes": 31681,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1CJeOYxU6LBIoH5KhWQ529Ah_JJ6A8y3w",
    "filename": "mock_coding_heap-stream_04.md",
    "mimeType": "text/markdown",
    "bytes": 29347,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "13kLPXJNDyYq4ddnXfQN-OGPdVLttXyGx",
    "filename": "mock_manager_async-execution_06.md",
    "mimeType": "text/markdown",
    "bytes": 32458,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1RKDp0uGA2ZSuemvJOGAqlGD4ZUSXlXy1",
    "filename": "mock_coding_dynamic-programming_05.md",
    "mimeType": "text/markdown",
    "bytes": 30011,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "18cuJI1AqqgpgJ13xqoX1o_IgSyQvMluz",
    "filename": "mock_manager_api-migration_03.md",
    "mimeType": "text/markdown",
    "bytes": 30606,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1YfbKeRfk_y1griybG4bCELRUS8Mw3gsw",
    "filename": "mock_coding_bfs-debugging_06.md",
    "mimeType": "text/markdown",
    "bytes": 28932,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1MTJ0oa5YhPgBDoVSxImSELsvFJwpl35W",
    "filename": "mock_behavioral_remote-collaboration_06.md",
    "mimeType": "text/markdown",
    "bytes": 26316,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1GO9WAq2xdypn1iC_v1_G1aCneVTsEvfm",
    "filename": "mock_behavioral_ownership-failure_01.md",
    "mimeType": "text/markdown",
    "bytes": 23928,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1awd9aTGpeTwQJuI2f__CRcatgc4fQoyF",
    "filename": "mock_behavioral_influence_04.md",
    "mimeType": "text/markdown",
    "bytes": 28398,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1w1AKJSEJbSfVobVMOR8KHzFzobmCTsfo",
    "filename": "mock_behavioral_customer-integrity_05.md",
    "mimeType": "text/markdown",
    "bytes": 27613,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "128TEzUk4zm-HmirZNyfTsA5onbbqJ51n",
    "filename": "mock_behavioral_conflict_02.md",
    "mimeType": "text/markdown",
    "bytes": 27563,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1joW6fis9MK4N8-KZS2uNCAB9PKQgEeAj",
    "filename": "mock_behavioral_ambiguity_03.md",
    "mimeType": "text/markdown",
    "bytes": 23247,
    "collection": "Mock interview scripts",
    "kind": "mock-script"
  },
  {
    "id": "1RfcL7I-ZfKLeKRJmcE-7HWsPRYI_1oEx",
    "filename": "mock_sysdesign_webhook-delivery_03_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 567506,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1WXQKGOfuq2yAhQKvcQ9L7XqYa71MK5NQ",
    "filename": "mock_sysdesign_webhook-delivery_03_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 594934,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1eg4uJa8F3zfHej-uYGdmS2cGipjRp8i0",
    "filename": "mock_sysdesign_url-shortener_01_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 568541,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1jpNvtUOck4wrrdtwsVSoJVqFLBShVzB1",
    "filename": "mock_sysdesign_url-shortener_01_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 607016,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1I4XH7Qw5K1GFjTt7VhrmcHvQTuU2OO04",
    "filename": "mock_sysdesign_notification-platform_02_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 593657,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1fEx3WAt-7ob2vi8roJWgoE3L_oh2bxh-",
    "filename": "mock_sysdesign_notification-platform_02_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 632231,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1WmqSl1t_mZBiTBieUTocLFkjhDf0VDJ9",
    "filename": "mock_sysdesign_job-scheduler_05_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 620267,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1EjPuWNcRowfGsim7DSdXTs5368iKuTyT",
    "filename": "mock_sysdesign_job-scheduler_05_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 658286,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1BTpmpLDhXtJs5Ou90CLY8sTgPbjo8W1T",
    "filename": "mock_sysdesign_file-storage_06_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 623615,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "19cZ5Ts4gbCVt-N9LLDOMly7LvdND0kE0",
    "filename": "mock_recruiter_remote-saas-backend_01_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 289288,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Vc0z7ZW7G3AdBTJ1-YfS5vrja9ISUwaQ",
    "filename": "mock_sysdesign_file-storage_06_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 664082,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1yBZqWO4GubC9PhVU3Px7nA0ijy9Qsxbt",
    "filename": "mock_recruiter_remote-saas-backend_01_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 352461,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1De9cmSmqD-IzwBtStSZ9DlqwsIt8uUkP",
    "filename": "mock_sysdesign_chat_04_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 548277,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1j5Ovyjwj4z5pMu-yTUd8hphZpChXq-qW",
    "filename": "mock_recruiter_platform-eor_03_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 350831,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1YQHJxdKcf3piWb7ytv-ZFag0YIVWfxpf",
    "filename": "mock_sysdesign_chat_04_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 598956,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1eZgGslVost-RYdRziacqwLNMjz6w-_a4",
    "filename": "mock_recruiter_platform-eor_03_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 375904,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1_bZKlENgX0dItAHZZctAZHM3MRpfWsvO",
    "filename": "mock_recruiter_services-to-product_04_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 319587,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "15DfOUDtpa_AzckBfs9MhqEWT74hwZD-R",
    "filename": "mock_recruiter_fullstack-contractor_06_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 351552,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Dqsiz89iCDERAc7P3eHEPZf2Be7wgbuB",
    "filename": "mock_recruiter_services-to-product_04_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 361040,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1J0tSXDYEGrOt8SHIyO9ReomgFnft2T8y",
    "filename": "mock_recruiter_fullstack-contractor_06_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 376682,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1vNW33dLuaKSFo83TfKI9KHmI3dJa53K5",
    "filename": "mock_recruiter_frontend-growth_02_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 313184,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1It_ROcO7eqawSVs1b5enHtYTIjDBmg9c",
    "filename": "mock_recruiter_frontend-growth_02_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 335369,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1wdm_TnTt0XeLybyoqGc2IqlOQM3-dWjp",
    "filename": "mock_recruiter_data-short-tenure_05_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 326941,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "15EPZwBixCZAL2DuaZsQx4ko6eLiWDH80",
    "filename": "mock_recruiter_data-short-tenure_05_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 349723,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "18th8sVl1VddCUiE7VpIn42OJYdTWt9vC",
    "filename": "mock_manager_quality-mentoring_05_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 629814,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1wov8WewbWW0F40y4rVAzED6omrYqQZHQ",
    "filename": "mock_manager_quality-mentoring_05_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 666389,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1XAE59JfYrrPhxhnObHn4slvqL686q_PH",
    "filename": "mock_manager_incident_02_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 622317,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1jCTc909xiOoseBBJdRHTF7aU2cYn2_fP",
    "filename": "mock_manager_incident_02_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 660398,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1fBvjihBdmocCcZD9WXNBIlzKtjKX0t-h",
    "filename": "mock_manager_frontend-performance_04_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 505454,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1I0B8t_Tygm1CMwOlPsTOVxvxQ_n_KmgF",
    "filename": "mock_manager_frontend-performance_04_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 559395,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Yt2snFCLgx24LIhE03M4Ab1zZZY8mQMI",
    "filename": "mock_manager_backend-project_01_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 561703,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1EV4tmB8MLoOsrDDHXlyTDXL6i8VTcEHR",
    "filename": "mock_manager_backend-project_01_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 599514,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1cyQLdt_aBgn55nKcvbJFx0KQ0RsslyZp",
    "filename": "mock_manager_async-execution_06_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 587988,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1EmQXsL9nC3O6hPC9y7rd7rwNBmFnGwM_",
    "filename": "mock_manager_async-execution_06_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 625831,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "19SvSLPg1ClbFEBKtv8N0Vv_SRx7lPRYW",
    "filename": "mock_manager_api-migration_03_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 550827,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1SQBBXqp-8yCub88RKfPJX8p454wHAOVQ",
    "filename": "mock_manager_api-migration_03_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 583651,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1JDn7Huq_kcolBpPEmQzuVQAUNq3ht23N",
    "filename": "mock_coding_intervals_02_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 478666,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1_xjnbZ-_gvoQZpJyC5xRgdLerRfo9pjA",
    "filename": "mock_coding_topological-sort_03_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 528687,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "15mvyOKqy_YA5IvNJIsGiMODfUeap91vb",
    "filename": "mock_coding_heap-stream_04_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 556889,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Fv3dHueE-iSBj_WjiGQAwbvKWWFMpmcQ",
    "filename": "mock_coding_topological-sort_03_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 562657,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "12iurd1sAMNaUgIemIyp7r9oxVlCI7peH",
    "filename": "mock_coding_heap-stream_04_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 593466,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1EmjGuLiFFJP_0ZLH-PdZB2_YbNGG8omt",
    "filename": "mock_coding_sliding-window_01_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 494493,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1xZQmFpWSabNry90CNbvPrIMYtO0vs8-x",
    "filename": "mock_coding_dynamic-programming_05_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 583318,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1haFYyflNJiD_A-ohNPavBvAElUuHQPZX",
    "filename": "mock_coding_sliding-window_01_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 527433,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1xA0BBJfD3SVYIh72Voa2yMpwMUMxGJhn",
    "filename": "mock_coding_dynamic-programming_05_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 620831,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Vmqn-dqxXzqESjfSZx-SR8mvP5TsTnqQ",
    "filename": "mock_coding_intervals_02_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 428890,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1MP44x50ztOaiDipGOp0S8DrnmX6AlUyV",
    "filename": "mock_coding_bfs-debugging_06_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 537733,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1fWjYeDOcsknIeVrWbIRNj6Qem4yQwV7J",
    "filename": "mock_coding_bfs-debugging_06_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 587319,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "183Zwuk0aObjhBN94duYY6BfxPUjSV9O2",
    "filename": "mock_behavioral_remote-collaboration_06_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 470694,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1p5w_7nP4Ejd4LUKi6jvPftSb4hZZdmSB",
    "filename": "mock_behavioral_remote-collaboration_06_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 518288,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1VBWqoeOJIC3Wh_d84WkF-j_ZvmbCPU48",
    "filename": "mock_behavioral_ownership-failure_01_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 442261,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "16d7Wz4W7meQpuw-QV9XbpELOEZRlBEif",
    "filename": "mock_behavioral_ownership-failure_01_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 469851,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1qWt7hNki6DSwR2hP7CmIckykPBUg4gl0",
    "filename": "mock_behavioral_influence_04_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 523159,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1qPVNfpOGcs2uSCWMavtfQzdnm8jxhBcV",
    "filename": "mock_behavioral_influence_04_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 565128,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1c3myyahTs7vyQw6qr-H8R_Z7ayUGcg8G",
    "filename": "mock_behavioral_customer-integrity_05_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 522022,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1_el03wYE2AtqIFDjHce28Xiu_mqYBa-0",
    "filename": "mock_behavioral_customer-integrity_05_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 555122,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "11GJcRN7CKzUYhdWvmJt6f4pM5Ynk2Bg_",
    "filename": "mock_behavioral_conflict_02_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 510691,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1m32Ma2h_aQv2t1MSSmr8fY4bZKniYJeH",
    "filename": "mock_behavioral_conflict_02_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 551919,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1HgYNzWfMveziCvjfPnKysA7Bv51KD6GM",
    "filename": "mock_behavioral_ambiguity_03_audio_timeline.json",
    "mimeType": "application/json",
    "bytes": 432718,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1isQtetmi-OogJHmNzVl-sCzSeWKrS4Sf",
    "filename": "mock_behavioral_ambiguity_03_audio_manifest.json",
    "mimeType": "application/json",
    "bytes": 461349,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "12UUTOHz6pXhPbPqtT2L8eyJiMLDeGmK3",
    "filename": "audio_audio_build_summary.json",
    "mimeType": "application/json",
    "bytes": 1537,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1yEci1vGjPcVA_fLZBz-QkK1uXLiVX06D",
    "filename": "audio_audio_hume_spend_ledger.json",
    "mimeType": "application/json",
    "bytes": 407,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "15zW-bSYKMan7umafTONa_KZlqJMIOjhI",
    "filename": "qa_voiced_video_qa.json",
    "mimeType": "application/json",
    "bytes": 419,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1fsCWzbGVNfvE2f24L8WB3kCBrnFFk_fS",
    "filename": "qa_visual_qa.json",
    "mimeType": "application/json",
    "bytes": 718,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1G9d2oG_Tsygq0l1J_KcDTerGkp7502wD",
    "filename": "qa_mock_interview_audio_loudness_sample.json",
    "mimeType": "application/json",
    "bytes": 853,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1DonGyS54II5eSzytn7cQXiRrsSnI_5gP",
    "filename": "qa_review_schema.json",
    "mimeType": "application/json",
    "bytes": 1149,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1msQQTHLN9l2M8UfKBoDXtphX7Roh4Kjd",
    "filename": "qa_candidate_prosody_pilot_audio_qa.json",
    "mimeType": "application/json",
    "bytes": 559,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1DTR5B52ze6kwoy4iQqUhkh9CdupgY87Q",
    "filename": "qa_mock_pilot_qa.json",
    "mimeType": "application/json",
    "bytes": 531,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "12scHP7-CBJCnDIuIqe4AiiFW1Ch9X9A_",
    "filename": "qa_automated_qa.json",
    "mimeType": "application/json",
    "bytes": 661318,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1f153GhA_3IJCXo-R97Kg82iFEpvhrZG1",
    "filename": "qa_mock_interview_video_qa.json",
    "mimeType": "application/json",
    "bytes": 695,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1pQ5f_NROaR6fkJq5f0dKLsigtuiftKMm",
    "filename": "mock-interviews_voice_assignments.json",
    "mimeType": "application/json",
    "bytes": 11609,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1MKitO4B25Bis243RieEdJD2PSMs4hVYd",
    "filename": "qa_mock_interview_scripts_qa.json",
    "mimeType": "application/json",
    "bytes": 28798,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "17Fn773ZaD0iUgxnVqUY3_2kjglwfW3_v",
    "filename": "mock-interviews_scenario_specs.json",
    "mimeType": "application/json",
    "bytes": 61445,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1CJecipz8vp9HumoQu2bUSDBJ3Z0fmFut",
    "filename": "qa_mock_interview_audio_qa.json",
    "mimeType": "application/json",
    "bytes": 1133,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1R7qlHjIHmbilgR4qzQgqv34TnBn4U5po",
    "filename": "mock-interviews_manifest.json",
    "mimeType": "application/json",
    "bytes": 29170,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1kSUei673vda2EIzG31ZvTdgDn08KEiQx",
    "filename": "mock-interviews_manifest.csv",
    "mimeType": "text/csv",
    "bytes": 14425,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1siTlHuvesrSAaeex49QV19_Lqa5tu7-i",
    "filename": "mock-interviews_catalog.json",
    "mimeType": "application/json",
    "bytes": 9732,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1bkGls20H_qUfE_Csz0CzyFnmUdSZq6kX",
    "filename": "mock-interviews_audio_preflight.json",
    "mimeType": "application/json",
    "bytes": 869,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1cAF-VWG9A7GoT93NuYCQbxRTQFDnSNdH",
    "filename": "mock-interviews_VOICE_ROSTER.md",
    "mimeType": "text/markdown",
    "bytes": 1640,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1oF8NrmRUtM5TuxWa00_tvlE6P4BGXzsP",
    "filename": "mock-interviews_PILOT_REVIEW.md",
    "mimeType": "text/markdown",
    "bytes": 3746,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1o5nycP2IYH2C9tmB6N5ssH7NfOZI6vl3",
    "filename": "mock-interviews_DESIGN.md",
    "mimeType": "text/markdown",
    "bytes": 7887,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "129huLIXwdPTlFV_h_RTg8MVqAG9WwPiB",
    "filename": "company-evidence_zoom.json",
    "mimeType": "application/json",
    "bytes": 2071,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1zPOmviLYY8SG8IHkQqHVmY0YTSCEQm2C",
    "filename": "company-evidence_zomato.json",
    "mimeType": "application/json",
    "bytes": 1704,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1NtgA2s4QacV-lO6rZ-ks8VeTI4W_eqSl",
    "filename": "company-evidence_zapier.json",
    "mimeType": "application/json",
    "bytes": 2081,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1ZzUiV0JFpj64-tsNmwVfw2aWdhyRbKcq",
    "filename": "company-evidence_workday.json",
    "mimeType": "application/json",
    "bytes": 2123,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1tL70rsUXzF5CO2e4xTcv9bF7Dsjx7ZQx",
    "filename": "company-evidence_walmart-global-tech.json",
    "mimeType": "application/json",
    "bytes": 1735,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "15z4K4Mc0cF6Nvr4cygeZJHtjEgdxR8OX",
    "filename": "company-evidence_uber.json",
    "mimeType": "application/json",
    "bytes": 2080,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Z1-1eIQ6-NjcOOWHKn_I8wZX-jaH3OjX",
    "filename": "company-evidence_twilio.json",
    "mimeType": "application/json",
    "bytes": 2797,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1BmTFn77BL4Oo0whWnBw975rU3CdllMMR",
    "filename": "company-evidence_thoughtworks.json",
    "mimeType": "application/json",
    "bytes": 2157,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Spy2dz0caI5MLwqyX9soxeFzUyzSODTk",
    "filename": "company-evidence_swiggy.json",
    "mimeType": "application/json",
    "bytes": 2074,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1XgXBo7q--ShVNCenNvDe9-FdmfloCbMC",
    "filename": "company-evidence_stripe.json",
    "mimeType": "application/json",
    "bytes": 1680,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1QtX1WAxAcfBo8ErnaFPYRZ95jtltLjvX",
    "filename": "company-evidence_snowflake.json",
    "mimeType": "application/json",
    "bytes": 1709,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1pj2NYDBM62sd3XTFQKPuqoYxMOZUhaf8",
    "filename": "company-evidence_snap.json",
    "mimeType": "application/json",
    "bytes": 2069,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1GFWrKSm6wnHKq7bx0eNgrv0tiP4iPS5a",
    "filename": "company-evidence_shopify.json",
    "mimeType": "application/json",
    "bytes": 1715,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1LRgL3TbsV0kdc8GZizqOYE71emX6NPtf",
    "filename": "company-evidence_servicenow.json",
    "mimeType": "application/json",
    "bytes": 1732,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1exWRu5dvzlLBdY7XIOJR_5l__h44d57K",
    "filename": "company-evidence_pinterest.json",
    "mimeType": "application/json",
    "bytes": 1684,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1ebJJsOh1FgCtcdPayRBVRzP9D9d7eRof",
    "filename": "company-evidence_salesforce.json",
    "mimeType": "application/json",
    "bytes": 1737,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1rIO2acbg_C3SujdDQ3CqHP7Ou03pPgpc",
    "filename": "company-evidence_phonepe.json",
    "mimeType": "application/json",
    "bytes": 1675,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1fZNgOBX9SwI_eC7JHX-t-w9eBFqzEjO-",
    "filename": "company-evidence_reddit.json",
    "mimeType": "application/json",
    "bytes": 2125,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1PoSlLAnpcfrLRbr0UDylXFpaEUeDaXx1",
    "filename": "company-evidence_paypal.json",
    "mimeType": "application/json",
    "bytes": 2535,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "12HLDdq0zSIInYT1zYTpDWrCCuJ7VPJlV",
    "filename": "company-evidence_razorpay.json",
    "mimeType": "application/json",
    "bytes": 1675,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1gp6bmB7VmkvVlgSJXk_9M6zYeXFOeI_z",
    "filename": "company-evidence_nvidia.json",
    "mimeType": "application/json",
    "bytes": 2068,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1XZ8xIQ7Plf9NNhyN5RK_cl4khi0OesbB",
    "filename": "company-evidence_postman.json",
    "mimeType": "application/json",
    "bytes": 1678,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1A82SpCx8mZuy6_gboEavzP-SpszDFD7E",
    "filename": "company-evidence_netflix.json",
    "mimeType": "application/json",
    "bytes": 1717,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1RJ4LDiA6_97d5do0U9CJQs1BaVkoJWey",
    "filename": "company-evidence_mongodb.json",
    "mimeType": "application/json",
    "bytes": 2091,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1R8KicuyzGftgEzEiy276GM16dAXO_Zgq",
    "filename": "company-evidence_microsoft.json",
    "mimeType": "application/json",
    "bytes": 1706,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1XFZsKdvLyv9lnTpI3oo7giMfEJfEdF2K",
    "filename": "company-evidence_meta.json",
    "mimeType": "application/json",
    "bytes": 1730,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1ga0jYrDKsrIBIawzwKQA4Ayrp6srgvbU",
    "filename": "company-evidence_meesho.json",
    "mimeType": "application/json",
    "bytes": 1695,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1R-9Djs3nXomWrg_KRMYTcAonnZQ0SJCZ",
    "filename": "company-evidence_linkedin.json",
    "mimeType": "application/json",
    "bytes": 1724,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1RKjbtPa-_iouc1A045Base299zEjpEcG",
    "filename": "company-evidence_intuit.json",
    "mimeType": "application/json",
    "bytes": 2124,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1e09odnjw8PAP7rUSke468NbMNMaskXhw",
    "filename": "company-evidence_hubspot.json",
    "mimeType": "application/json",
    "bytes": 2083,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1wGbj0PoEb8CF1YH9jhZORZTBSBgZ4qy4",
    "filename": "company-evidence_google.json",
    "mimeType": "application/json",
    "bytes": 1737,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Lpy1kqxcD1T-_wj2TjJ3bmTH8NZ3nndz",
    "filename": "company-evidence_gitlab.json",
    "mimeType": "application/json",
    "bytes": 2014,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1sabBmS5DSOxQenJNeK3T8socGuFTGT9I",
    "filename": "company-evidence_github.json",
    "mimeType": "application/json",
    "bytes": 2097,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Ujl3DdVUyVFvhjBa8J5ziDZ1HDR8a0D6",
    "filename": "company-evidence_freshworks.json",
    "mimeType": "application/json",
    "bytes": 1697,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1F_VEKK5m3lfzwqZ8EGyYWLkfUZAhXpMI",
    "filename": "company-evidence_flipkart.json",
    "mimeType": "application/json",
    "bytes": 1716,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "17Bda4cxsSlGIO-mwDpDJJyIo2QaHGKlN",
    "filename": "company-evidence_epam.json",
    "mimeType": "application/json",
    "bytes": 1708,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "10FwghNRvP4hfKLMwAP1OV-PUEjWfIibC",
    "filename": "company-evidence_dropbox.json",
    "mimeType": "application/json",
    "bytes": 2116,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1_QEMns0FsIKA4F8fzzSzqjpUmXHpE1yW",
    "filename": "company-evidence_doordash.json",
    "mimeType": "application/json",
    "bytes": 2122,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "168bvIxpb3tlFYzvp9v6aeFp6cQa8ykvi",
    "filename": "company-evidence_databricks.json",
    "mimeType": "application/json",
    "bytes": 1705,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "18w7K1bPT51Nf88Ri39ogSKxuVUqhI-zt",
    "filename": "company-evidence_coinbase.json",
    "mimeType": "application/json",
    "bytes": 1682,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1xsmKPE5XpqtLpZ3jnA-NsKmP9cdwUQJw",
    "filename": "company-evidence_cloudflare.json",
    "mimeType": "application/json",
    "bytes": 2115,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1540VH5jI_2KN5ZquYqBlnlGglpI3N-xV",
    "filename": "company-evidence_canonical.json",
    "mimeType": "application/json",
    "bytes": 2153,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1zIxZGx4v1turU-ET_1p00pR8VJVcUnjt",
    "filename": "company-evidence_browserstack.json",
    "mimeType": "application/json",
    "bytes": 1714,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1dU3wCWsR_vC8tUKPYgrsnfITLZyRH38X",
    "filename": "company-evidence_amazon.json",
    "mimeType": "application/json",
    "bytes": 1730,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1_636JyxS1eqifHT8i5D53-LMgsn-eo1V",
    "filename": "company-evidence_block.json",
    "mimeType": "application/json",
    "bytes": 1670,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1U424iKcUhbSOAFoHXqULfHAYW8U1Ojjw",
    "filename": "company-evidence_airbnb.json",
    "mimeType": "application/json",
    "bytes": 2103,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "15S5Tf9yT1-UA0NrDvfG4gH0-sT26MTFv",
    "filename": "company-evidence_automattic.json",
    "mimeType": "application/json",
    "bytes": 2444,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "15_iaL6x-evsphC9NagJOX5sNWuQIcZ5J",
    "filename": "company-evidence_adobe.json",
    "mimeType": "application/json",
    "bytes": 2075,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "12b6C1BRVr2NtB8e5utwLsbjfBzPw1odI",
    "filename": "company-evidence_atlassian.json",
    "mimeType": "application/json",
    "bytes": 2129,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "193f0HPWMnX-HplIsXBblccDar_M4Sjly",
    "filename": "voiced-video_manifest.csv",
    "mimeType": "text/csv",
    "bytes": 37353,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1HGGsEMfP3NyZGZx9Bqf2P7UK21fenJs8",
    "filename": "company-evidence_apple.json",
    "mimeType": "application/json",
    "bytes": 2104,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1Va7cv9ckWnInUYcVphUf6WccTgb7gJrD",
    "filename": "voiced-video_manifest.json",
    "mimeType": "application/json",
    "bytes": 69226,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "19oj1ZH59R_fkmGhQvkcJtwZEqv8Kv67m",
    "filename": "delivery_exclusions.json",
    "mimeType": "application/json",
    "bytes": 559,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1XS15N1wDzOwNupcGI4jfEJ-xoT1vUoTj",
    "filename": "delivery_manifest.csv",
    "mimeType": "text/csv",
    "bytes": 170487,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1dRmBu2eUmR03YO8vKFdwXfru41Azar_m",
    "filename": "delivery_manifest.json",
    "mimeType": "application/json",
    "bytes": 438905,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1eLPMLTfiLzNzwLNJ_Aup0VOInqOriFvQ",
    "filename": "catalog_production_catalog_summary.json",
    "mimeType": "application/json",
    "bytes": 203,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1hBBWbl3BF3RbNjVampNaDazXhL61EmoH",
    "filename": "catalog_production_catalog.json",
    "mimeType": "application/json",
    "bytes": 358546,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1zheM2-l5t403epnqG2pM0kN6A-FctcJm",
    "filename": "vault_STATUS.md",
    "mimeType": "text/markdown",
    "bytes": 2992,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  },
  {
    "id": "1UujMIm3TJlMlHAjwTOuNC3l7nqbOjPax",
    "filename": "vault_README.md",
    "mimeType": "text/markdown",
    "bytes": 4140,
    "collection": "Manifests and evidence",
    "kind": "manifest"
  }
] as const;

const ACRONYMS: Record<string, string> = {
  ai: "AI",
  api: "API",
  ats: "ATS",
  bfs: "BFS",
  cdn: "CDN",
  dsa: "DSA",
  dp: "DP",
  eor: "EOR",
  id: "ID",
  mp4: "MP4",
  m4a: "M4A",
  md: "MD",
  nosql: "NoSQL",
  srt: "SRT",
  sql: "SQL",
  url: "URL",
};

function titleCase(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => ACRONYMS[word.toLowerCase()] ?? word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function stripMaterialSuffix(stem: string) {
  return stem
    .replace(/_transcript$/i, "")
    .replace(/_storyboard$/i, "")
    .replace(/_audio_(?:timeline|manifest)$/i, "")
    .replace(/_audio$/i, "")
    .replace(/_01_audio_(?:timeline|manifest)$/i, "")
    .replace(/_01$/i, "")
    .replace(/_0[1-9]$/i, "")
    .replace(/_\d+$/i, "");
}

export function driveMaterialTitle(filename: string) {
  const stem = filename.replace(/\.[^.]+$/i, "");
  const withoutPrefix = stem.replace(/^(?:mock_|dsa_|sysdesign_|behavioral_|remote_|roadmap_|operations_|company_)/i, "");
  return titleCase(stripMaterialSuffix(withoutPrefix));
}

export function driveMaterialCategory(filename: string) {
  if (/^(?:dsa_)/i.test(filename)) return "DSA patterns";
  if (/^(?:sysdesign_)/i.test(filename)) return "System design";
  if (/^(?:behavioral_)/i.test(filename)) return "Behavioural";
  if (/^(?:remote_)/i.test(filename)) return "Remote career";
  if (/^(?:roadmap_)/i.test(filename)) return "Roadmaps";
  if (/^(?:operations_)/i.test(filename)) return "Operations";
  if (/^(?:company_)/i.test(filename)) return "Company research";
  if (/^mock_/i.test(filename)) {
    if (/^mock_coding_/i.test(filename)) return "Coding mock";
    if (/^mock_behavioral_/i.test(filename)) return "Behavioural mock";
    if (/^mock_recruiter_/i.test(filename)) return "Recruiter mock";
    if (/^mock_manager_/i.test(filename)) return "Manager mock";
    return "Mock interview";
  }
  return "Production archive";
}

export function driveMaterialKindLabel(kind: DriveMaterialKind) {
  return {
    template: "Word template",
    narrated: "Narrated explainer",
    silent: "Silent explainer",
    transcript: "Transcript",
    caption: "Caption file",
    storyboard: "Storyboard",
    "mock-audio": "Mock interview audio",
    "mock-script": "Mock interview script",
    manifest: "Manifest / evidence",
  }[kind];
}

export function driveMaterialSlug(material: Pick<DriveMaterial, "id" | "filename">) {
  const normalized = material.filename.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized + "-" + material.id.slice(-8).toLowerCase();
}

export function driveMaterialHref(material: Pick<DriveMaterial, "id" | "filename">) {
  return "/learn/library/material/" + driveMaterialSlug(material);
}

export function driveMaterialPreviewHref(material: Pick<DriveMaterial, "id" | "filename">) {
  return "/api/learn/library/material-preview/" + driveMaterialSlug(material);
}

export function driveMaterialAssetHref(filename: string) {
  return "/drive-materials/" + encodeURIComponent(filename);
}

export function driveMaterialPrimaryAssetHref(material: Pick<DriveMaterial, "filename" | "kind">) {
  // Large media masters stay in Drive and are loaded by the authenticated media
  // viewer; first-party mirrors handle the smaller document and text records.
  if (material.kind === "narrated" || material.kind === "silent" || material.kind === "mock-audio") {
    return null;
  }
  return driveMaterialAssetHref(material.filename);
}

export function driveMaterialCompanionFilename(material: Pick<DriveMaterial, "filename" | "kind">) {
  if (material.kind === "template") {
    return material.filename.replace(/\.[^.]+$/i, ".preview.txt");
  }
  if (material.kind === "narrated" || material.kind === "silent") {
    return material.filename.replace(/\.mp4$/i, "_transcript.md");
  }
  if (material.kind === "mock-audio") {
    return material.filename.replace(/\.m4a$/i, ".md");
  }
  return null;
}

export function driveMaterialCompanionAssetHref(material: Pick<DriveMaterial, "filename" | "kind">) {
  const filename = driveMaterialCompanionFilename(material);
  return filename ? driveMaterialAssetHref(filename) : null;
}

export function formatMaterialSize(bytes: number) {
  if (bytes >= 1_000_000_000) return (bytes / 1_000_000_000).toFixed(1) + " GB";
  if (bytes >= 1_000_000) return (bytes / 1_000_000).toFixed(1) + " MB";
  if (bytes >= 1_000) return Math.round(bytes / 1_000) + " KB";
  return bytes + " B";
}

export function findDriveMaterial(slug: string) {
  return DRIVE_MATERIALS.find((material) => isActiveDriveRecord(material.filename, material.kind) && driveMaterialSlug(material) === slug) ?? null;
}
