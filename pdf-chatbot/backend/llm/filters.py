"""
Post-filtering utilities for structured queries
Filters results in Python for accuracy and completeness
"""

import re
from typing import List, Dict, Any, Optional


def parse_range(range_str: str) -> Optional[tuple]:
    """
    Parse a range string like "9-16" or "5,0 - 13,5"
    
    Returns:
        (min, max) tuple or None if parsing fails
    """
    if not range_str:
        return None
    
    try:
        # Clean the string
        cleaned = str(range_str).replace(",", ".").strip()
        
        # Try to find range pattern
        match = re.search(r'(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)', cleaned)
        if match:
            return (float(match.group(1)), float(match.group(2)))
        
        # Try single value
        match = re.search(r'(\d+\.?\d*)', cleaned)
        if match:
            val = float(match.group(1))
            return (val, val)
            
    except (ValueError, AttributeError):
        pass
    
    return None


def ranges_overlap(range1: tuple, range2: tuple) -> bool:
    """
    Check if two ranges overlap
    
    Args:
        range1: (min1, max1)
        range2: (min2, max2)
        
    Returns:
        True if ranges overlap
    """
    min1, max1 = range1
    min2, max2 = range2
    
    # Ranges overlap if: max1 >= min2 AND max2 >= min1
    return max1 >= min2 and max2 >= min1


def filter_by_conductor_diameter(
    results: List[Dict],
    min_diameter: float,
    max_diameter: float
) -> List[Dict]:
    """
    Filter results by conductor diameter range overlap
    
    Args:
        results: List of result dicts with 'conductor_diameter' field
        min_diameter: Minimum diameter to check
        max_diameter: Maximum diameter to check
        
    Returns:
        Filtered list
    """
    filtered = []
    target_range = (min_diameter, max_diameter)
    
    for result in results:
        conductor_dia = result.get('conductor_diameter')
        if not conductor_dia:
            continue
        
        dia_range = parse_range(conductor_dia)
        if dia_range and ranges_overlap(dia_range, target_range):
            filtered.append(result)
    
    return filtered


def filter_by_weight(
    results: List[Dict],
    max_weight: Optional[float] = None,
    min_weight: Optional[float] = None
) -> List[Dict]:
    """
    Filter results by weight
    
    Args:
        results: List of result dicts with 'weight_kg' field
        max_weight: Maximum weight (inclusive)
        min_weight: Minimum weight (inclusive)
        
    Returns:
        Filtered list
    """
    filtered = []
    
    for result in results:
        weight = result.get('weight_kg')
        
        # Skip if weight is missing
        if weight is None:
            continue
        
        # Convert to float if string
        try:
            weight = float(str(weight).replace(',', '.'))
        except (ValueError, AttributeError):
            continue
        
        # Apply filters
        if max_weight is not None and weight > max_weight:
            continue
        if min_weight is not None and weight < min_weight:
            continue
        
        filtered.append(result)
    
    return filtered


def filter_by_breaking_load(
    results: List[Dict],
    min_load: Optional[float] = None,
    max_load: Optional[float] = None
) -> List[Dict]:
    """
    Filter results by breaking load
    
    Args:
        results: List of result dicts with 'breaking_load_kN' field
        min_load: Minimum load in kN
        max_load: Maximum load in kN
        
    Returns:
        Filtered list
    """
    filtered = []
    
    for result in results:
        load = result.get('breaking_load_kN')
        
        if load is None:
            continue
        
        try:
            load = float(load)
        except (ValueError, TypeError):
            continue
        
        if min_load is not None and load < min_load:
            continue
        if max_load is not None and load > max_load:
            continue
        
        filtered.append(result)
    
    return filtered


def apply_combined_filters(
    results: List[Dict],
    conductor_diameter_range: Optional[tuple] = None,
    weight_max: Optional[float] = None,
    weight_min: Optional[float] = None,
    breaking_load_min: Optional[float] = None,
    breaking_load_max: Optional[float] = None
) -> List[Dict]:
    """
    Apply multiple filters in sequence
    
    Args:
        results: List of result dicts
        conductor_diameter_range: (min, max) tuple for diameter
        weight_max: Maximum weight
        weight_min: Minimum weight
        breaking_load_min: Minimum breaking load
        breaking_load_max: Maximum breaking load
        
    Returns:
        Filtered list
    """
    filtered = results
    
    if conductor_diameter_range:
        filtered = filter_by_conductor_diameter(
            filtered,
            conductor_diameter_range[0],
            conductor_diameter_range[1]
        )
    
    if weight_max is not None or weight_min is not None:
        filtered = filter_by_weight(filtered, weight_max, weight_min)
    
    if breaking_load_min is not None or breaking_load_max is not None:
        filtered = filter_by_breaking_load(filtered, breaking_load_min, breaking_load_max)
    
    return filtered
