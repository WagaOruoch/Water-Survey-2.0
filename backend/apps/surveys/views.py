from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import SurveyResponse
from .serializers import SurveyResponseSerializer


class SurveyResponseListCreateView(APIView):
    """
    GET  /api/responses/  — list all submitted responses
    POST /api/responses/  — submit a new survey response
    """

    def get(self, request):
        responses = SurveyResponse.objects.all()
        serializer = SurveyResponseSerializer(responses, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = SurveyResponseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SurveyResponseDetailView(APIView):
    """
    GET /api/responses/<id>/  — retrieve a single response by UUID
    """

    def get(self, request, pk):
        try:
            response = SurveyResponse.objects.get(pk=pk)
        except SurveyResponse.DoesNotExist:
            return Response(
                {"error": "Response not found."}, status=status.HTTP_404_NOT_FOUND
            )
        serializer = SurveyResponseSerializer(response)
        return Response(serializer.data)
