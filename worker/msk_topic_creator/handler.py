import os
from kafka.admin import KafkaAdminClient, NewTopic
from kafka.errors import TopicAlreadyExistsError
from dotenv import load_dotenv
load_dotenv()

def create_kafka_admin_client():
    """Create Kafka admin client with IAM auth"""
    return KafkaAdminClient(
        bootstrap_servers=os.getenv("MSK_BROKERS").split(","),
        security_protocol='PLAINTEXT'
    )

def handler(event, context):
    try:
        # Get parameters from event
        topic_name = event['topic_name']
        partitions = event['partitions']
        replication_factor = event['replication_factor']
        configs = event.get('configs', {})
        
        # Create admin client with IAM auth
        admin_client = create_kafka_admin_client()
        
        # Create topic definition
        topic = NewTopic(
            name=topic_name,
            num_partitions=partitions,
            replication_factor=replication_factor,
            topic_configs=configs
        )
        
        try:
            admin_client.create_topics([topic])
            return {
                'statusCode': 200,
                'body': f"Topic {topic_name} created successfully"
            }
        except TopicAlreadyExistsError:
            return {
                'statusCode': 200,
                'body': f"Topic {topic_name} already exists"
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': f"Error creating topic: {str(e)}"
        }
    finally:
        if 'admin_client' in locals():
            admin_client.close()