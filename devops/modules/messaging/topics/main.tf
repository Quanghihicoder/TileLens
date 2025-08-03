locals {
  kafka_topics = {
    audio_send = {
      topic              = "audio.send"
      partitions         = 3
      replication_factor = 2
      retention          = 86400000
    }
    transcription_results = {
      topic              = "transcription.results"
      partitions         = 3
      replication_factor = 2
      retention          = 86400000
    }
  }
}

resource "aws_lambda_invocation" "create_topics" {
  for_each = local.kafka_topics

  function_name = var.msk_topic_creator_function_name

  input = jsonencode({
    topic_name         = each.value.topic
    partitions         = each.value.partitions
    replication_factor = each.value.replication_factor
    configs = {
      "retention.ms"   = each.value.retention,
      "cleanup.policy" = "delete"
    }
  })
}
