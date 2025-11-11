"""
Unit tests for Earthquake Agent
Tests basic functionality and helper functions
"""

import unittest
from datetime import datetime
import sys
import os

# Add agent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'agent'))

from earthquake_agent.agent import get_current_datetime, mcp_streamable_http_tool


class TestAgentHelpers(unittest.TestCase):
    """Test helper functions in the agent"""

    def test_get_current_datetime_returns_iso_format(self):
        """Test that get_current_datetime returns a valid ISO 8601 string"""
        result = get_current_datetime()
        
        # Should be a string
        self.assertIsInstance(result, str)
        
        # Should be parseable as ISO format
        try:
            parsed = datetime.fromisoformat(result)
            self.assertIsInstance(parsed, datetime)
        except ValueError:
            self.fail("get_current_datetime did not return valid ISO 8601 format")

    def test_get_current_datetime_is_recent(self):
        """Test that get_current_datetime returns current time"""
        before = datetime.now()
        result = get_current_datetime()
        after = datetime.now()
        
        parsed = datetime.fromisoformat(result)
        
        # The returned time should be between before and after
        self.assertGreaterEqual(parsed, before)
        self.assertLessEqual(parsed, after)

    def test_mcp_streamable_http_tool_returns_toolset(self):
        """Test that mcp_streamable_http_tool returns an MCPToolset"""
        try:
            # This will fail if SERVER_API_KEY or SERVER_API_URL are not set
            # but we're just testing the function exists and returns something
            toolset = mcp_streamable_http_tool()
            
            # Should return an object
            self.assertIsNotNone(toolset)
            
            # Should have the expected type name
            self.assertIn('MCPToolset', str(type(toolset)))
        except Exception as e:
            # If environment variables are not set, that's okay for unit tests
            # We're just testing the function is defined
            self.assertIn('SERVER_API', str(e))


class TestAgentConfiguration(unittest.TestCase):
    """Test agent configuration and setup"""

    def test_agent_instruction_is_defined(self):
        """Test that INSTRUCTION constant is defined"""
        from earthquake_agent.agent import INSTRUCTION
        
        self.assertIsInstance(INSTRUCTION, str)
        self.assertGreater(len(INSTRUCTION), 0)
        self.assertIn("QuakeGuide", INSTRUCTION)

    def test_agent_instruction_contains_key_sections(self):
        """Test that INSTRUCTION contains required sections"""
        from earthquake_agent.agent import INSTRUCTION
        
        # Check for key sections
        self.assertIn("Tools (contract)", INSTRUCTION)
        self.assertIn("Core Behavior", INSTRUCTION)
        self.assertIn("Output Format", INSTRUCTION)
        self.assertIn("Safety Note", INSTRUCTION)

    def test_root_agent_is_defined(self):
        """Test that root_agent is properly configured"""
        from earthquake_agent.agent import root_agent
        
        self.assertIsNotNone(root_agent)
        self.assertEqual(root_agent.name, "earthquake_agent")
        self.assertEqual(root_agent.model, "gemini-2.5-flash")


class TestAgentTools(unittest.TestCase):
    """Test agent tools configuration"""

    def test_agent_has_required_tools(self):
        """Test that agent has the required tools"""
        from earthquake_agent.agent import root_agent
        
        # Agent should have tools
        self.assertIsNotNone(root_agent.tools)
        self.assertGreater(len(root_agent.tools), 0)
        
        # Should have at least 2 tools
        self.assertGreaterEqual(len(root_agent.tools), 2)


if __name__ == '__main__':
    unittest.main()

